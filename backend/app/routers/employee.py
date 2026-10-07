import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Employee, Department, Designation, LeaveBalance, LeaveRequest,
    LeaveType, User, EmployeeDocument, SalaryStructure
)
from app.schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeRead, EmployeeListResponse,
    DepartmentRead, DesignationRead, HierarchyNode, LeaveBalanceRead, LeaveRequestRead,
    EmployeeDocumentCreate, EmployeeDocumentRead
)
from app.auth_utils import get_current_user, require_hr, hash_password, log_audit_action

router = APIRouter(prefix="/api", tags=["Employees"])

def employee_options():
    return [
        joinedload(Employee.department),
        joinedload(Employee.designation),
        joinedload(Employee.manager)
    ]

@router.get("/departments", response_model=List[DepartmentRead])
async def get_departments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).where(Department.is_deleted == False))
    return result.scalars().all()

@router.get("/designations", response_model=List[DesignationRead])
async def get_designations(department_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(Designation).where(Designation.is_deleted == False)
    if department_id:
        query = query.where(Designation.department_id == department_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/employees/me", response_model=EmployeeRead)
async def get_my_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(Employee).options(*employee_options()).where(Employee.id == current_user.employee_id)
    res = await db.execute(stmt)
    emp = res.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found.")
    return emp

@router.post("/employees", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
async def create_employee(
    payload: EmployeeCreate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    email_check = await db.execute(
        select(Employee).where(Employee.email == payload.email, Employee.is_deleted == False)
    )
    if email_check.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An active employee with this email already exists.")

    code_check = await db.execute(
        select(Employee).where(Employee.employee_code == payload.employee_code, Employee.is_deleted == False)
    )
    if code_check.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An active employee with this code already exists.")

    dept = await db.get(Department, payload.department_id)
    if not dept or dept.is_deleted:
        raise HTTPException(status_code=400, detail="Invalid department ID.")

    desig = await db.get(Designation, payload.designation_id)
    if not desig or desig.is_deleted:
        raise HTTPException(status_code=400, detail="Invalid designation ID.")

    if payload.manager_id:
        manager = await db.get(Employee, payload.manager_id)
        if not manager or manager.is_deleted:
            raise HTTPException(status_code=400, detail="Invalid manager ID.")

    emp_data = payload.model_dump(exclude={"default_password", "role"})
    employee = Employee(**emp_data)
    db.add(employee)
    await db.flush()

    # Create associated User account with default password & role
    user_role = payload.role if payload.role in ["HR", "EMPLOYEE"] else "EMPLOYEE"
    default_pwd = payload.default_password or "Mponline@123"
    user = User(
        employee_id=employee.id,
        employee_code=employee.employee_code,
        password_hash=hash_password(default_pwd),
        role=user_role,
        is_active=True,
        must_change_password=True
    )
    db.add(user)

    # Automatically initialize leave balances for current year
    current_year = employee.date_of_joining.year
    lt_stmt = select(LeaveType).where(LeaveType.is_active == True, LeaveType.is_deleted == False)
    lt_res = await db.execute(lt_stmt)
    leave_types = lt_res.scalars().all()
    for lt in leave_types:
        bal = LeaveBalance(
            employee_id=employee.id,
            leave_type_id=lt.id,
            year=current_year,
            allocated_days=lt.yearly_allotment,
            used_days=0,
            remaining_days=lt.yearly_allotment
        )
        db.add(bal)

    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "EMPLOYEE_CREATED", "Employee", employee.id, f"Onboarded employee {employee.employee_code} ({employee.first_name} {employee.last_name})")

    stmt = select(Employee).options(*employee_options()).where(Employee.id == employee.id)
    res = await db.execute(stmt)
    return res.scalar_one()

@router.get("/employees", response_model=EmployeeListResponse)
async def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    designation_id: Optional[str] = None,
    employment_status: Optional[str] = None,
    employment_type: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Employee).where(Employee.is_deleted == False)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.where(
            or_(
                Employee.first_name.ilike(search_filter),
                Employee.last_name.ilike(search_filter),
                Employee.email.ilike(search_filter),
                Employee.employee_code.ilike(search_filter)
            )
        )
    if department_id:
        query = query.where(Employee.department_id == department_id)
    if designation_id:
        query = query.where(Employee.designation_id == designation_id)
    if employment_status:
        query = query.where(Employee.employment_status == employment_status)
    if employment_type:
        query = query.where(Employee.employment_type == employment_type)

    count_stmt = select(func.count()).select_from(query.subquery())
    total_count = (await db.execute(count_stmt)).scalar() or 0

    sort_col = getattr(Employee, sort_by, Employee.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    query = query.options(*employee_options()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    employees = result.scalars().all()
    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 1

    return {"items": employees, "page": page, "page_size": page_size, "total": total_count, "total_pages": total_pages}

@router.get("/employees/{employee_id}", response_model=EmployeeRead)
async def get_employee(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Employee can view self, or anyone in directory; HR has full view
    stmt = select(Employee).options(*employee_options()).where(Employee.id == employee_id, Employee.is_deleted == False)
    res = await db.execute(stmt)
    employee = res.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")
    return employee

@router.patch("/employees/{employee_id}", response_model=EmployeeRead)
async def update_employee(
    employee_id: str,
    payload: EmployeeUpdate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Employee).options(*employee_options()).where(Employee.id == employee_id, Employee.is_deleted == False)
    res = await db.execute(stmt)
    employee = res.scalar_one_or_none()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")

    update_data = payload.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"] != employee.email:
        email_check = await db.execute(
            select(Employee).where(Employee.email == update_data["email"], Employee.id != employee_id, Employee.is_deleted == False)
        )
        if email_check.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="An employee with this email already exists.")

    if "department_id" in update_data and update_data["department_id"] is not None:
        dept = await db.get(Department, update_data["department_id"])
        if not dept or dept.is_deleted:
            raise HTTPException(status_code=400, detail="Invalid department ID.")

    if "designation_id" in update_data and update_data["designation_id"] is not None:
        desig = await db.get(Designation, update_data["designation_id"])
        if not desig or desig.is_deleted:
            raise HTTPException(status_code=400, detail="Invalid designation ID.")

    if "manager_id" in update_data and update_data["manager_id"] is not None:
        if update_data["manager_id"] == employee_id:
            raise HTTPException(status_code=400, detail="Employee cannot be their own manager.")
        mgr = await db.get(Employee, update_data["manager_id"])
        if not mgr or mgr.is_deleted:
            raise HTTPException(status_code=400, detail="Invalid manager ID.")

    for field, value in update_data.items():
        setattr(employee, field, value)

    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "EMPLOYEE_UPDATED", "Employee", employee.id, f"Updated profile fields for {employee.employee_code}")

    # Re-fetch with fresh relationships
    res = await db.execute(select(Employee).options(*employee_options()).where(Employee.id == employee_id))
    return res.scalar_one()

@router.delete("/employees/{employee_id}", status_code=status.HTTP_200_OK)
async def delete_employee(
    employee_id: str,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    employee = await db.get(Employee, employee_id)
    if not employee or employee.is_deleted:
        raise HTTPException(status_code=404, detail="Employee not found.")

    employee.is_deleted = True
    employee.employment_status = "TERMINATED"

    # Also deactivate associated user account
    user_stmt = select(User).where(User.employee_id == employee_id)
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()
    if user:
        user.is_active = False

    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "EMPLOYEE_DEACTIVATED", "Employee", employee.id, f"Soft-deleted employee {employee.employee_code}")

    return {"message": "Employee and associated account deactivated successfully."}

@router.post("/employees/{employee_id}/reactivate", status_code=status.HTTP_200_OK)
async def reactivate_employee(
    employee_id: str,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    employee = await db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")

    employee.is_deleted = False
    employee.employment_status = "ACTIVE"

    user_stmt = select(User).where(User.employee_id == employee_id)
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()
    if user:
        user.is_active = True

    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "EMPLOYEE_REACTIVATED", "Employee", employee.id, f"Reactivated employee {employee.employee_code}")

    return {"message": "Employee reactivated successfully."}

@router.get("/employees/{employee_id}/documents", response_model=List[EmployeeDocumentRead])
async def get_employee_documents(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "HR" and current_user.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized to view these documents.")

    stmt = select(EmployeeDocument).where(EmployeeDocument.employee_id == employee_id).order_by(EmployeeDocument.uploaded_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/employees/{employee_id}/documents", response_model=EmployeeDocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_employee_document(
    employee_id: str,
    payload: EmployeeDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "HR" and current_user.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized to upload document for this employee.")

    doc = EmployeeDocument(
        employee_id=employee_id,
        title=payload.title,
        document_type=payload.document_type,
        file_url=payload.file_url
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

@router.get("/employees/{employee_id}/manager", response_model=Optional[EmployeeRead])
async def get_employee_manager(employee_id: str, db: AsyncSession = Depends(get_db)):
    employee = await db.get(Employee, employee_id)
    if not employee or employee.is_deleted or not employee.manager_id:
        return None
    stmt = select(Employee).options(*employee_options()).where(Employee.id == employee.manager_id, Employee.is_deleted == False)
    res = await db.execute(stmt)
    return res.scalar_one_or_none()

@router.get("/employees/{employee_id}/reports", response_model=List[EmployeeRead])
async def get_direct_reports(employee_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Employee).options(*employee_options()).where(Employee.manager_id == employee_id, Employee.is_deleted == False)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/employees/{employee_id}/hierarchy", response_model=HierarchyNode)
async def get_employee_hierarchy(employee_id: str, db: AsyncSession = Depends(get_db)):
    async def build_tree(emp_id: str, current_depth: int = 1, visited: set = None, max_depth: int = 5):
        if visited is None:
            visited = set()
        if current_depth > max_depth or emp_id in visited:
            return None
        visited.add(emp_id)
        stmt = (
            select(Employee)
            .options(joinedload(Employee.department), joinedload(Employee.designation))
            .where(Employee.id == emp_id, Employee.is_deleted == False)
        )
        res = await db.execute(stmt)
        emp = res.scalar_one_or_none()
        if not emp:
            return None
        reports_stmt = select(Employee.id).where(Employee.manager_id == emp_id, Employee.is_deleted == False)
        reports_res = await db.execute(reports_stmt)
        report_ids = reports_res.scalars().all()
        reports_list = []
        for r_id in report_ids:
            child = await build_tree(r_id, current_depth + 1, visited.copy())
            if child:
                reports_list.append(child)
        return {
            "id": emp.id,
            "employee_code": emp.employee_code,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "email": emp.email,
            "designation_name": emp.designation.name if emp.designation else None,
            "department_name": emp.department.name if emp.department else None,
            "reports": reports_list
        }

    tree = await build_tree(employee_id, 1, set())
    if not tree:
        raise HTTPException(status_code=404, detail="Employee not found or invalid hierarchy.")
    return tree

@router.get("/employees/{employee_id}/leave-balances", response_model=List[LeaveBalanceRead])
async def get_employee_leave_balances(
    employee_id: str,
    year: int = Query(2026),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "HR" and current_user.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to leave balances.")

    stmt = (
        select(LeaveBalance)
        .options(joinedload(LeaveBalance.leave_type))
        .where(LeaveBalance.employee_id == employee_id, LeaveBalance.year == year)
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/employees/{employee_id}/leaves", response_model=List[LeaveRequestRead])
async def get_employee_leave_history(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "HR" and current_user.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to leave history.")

    stmt = (
        select(LeaveRequest)
        .options(
            joinedload(LeaveRequest.leave_type),
            joinedload(LeaveRequest.employee).joinedload(Employee.department),
            joinedload(LeaveRequest.employee).joinedload(Employee.designation),
            joinedload(LeaveRequest.employee).joinedload(Employee.manager)
        )
        .where(LeaveRequest.employee_id == employee_id, LeaveRequest.is_deleted == False)
        .order_by(LeaveRequest.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()
