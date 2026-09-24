-- Deepen Bookkeeping and Payroll assessment evidence packs without replacing #434 rubrics/instructions.
-- Append additional cross-file evidence idempotently.

update public.training_assessments a
set resource_pack =
  a.resource_pack
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='ar_ledger'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','ar_ledger','kind','csv','title','Cedar Lane AR and customer-status extract',
        'content',$r$customer,invoice,issue_date,original_amount,receipt_evidence,credit_evidence,current_status,note
Acme Interiors,CL-219,2026-08-28,1800,None,None,Overdue,No response to first reminder
Blue Ridge Co,CL-220,2026-09-02,950,950 received 2026-09-20,None,Unmatched receipt,Bank reference missing invoice number
Central Works,CL-221,2026-09-05,2400,None,None,Disputed,Customer says service was cancelled
Dune Studio,CL-222,2026-09-08,1200,600 received,None,Part paid,Remaining 600 open
Elm Group,CL-223,2026-09-10,700,None,Credit request pending,Open,No approved credit yet$r$
      )
    ) end
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='coding_queries'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','coding_queries','kind','csv','title','Cedar Lane coding-review sample',
        'content',$r$transaction,date,amount,source_description,historical_treatment,issue
T1,2026-09-12,1490,Software subscription plus setup services,Software expense,Mixed invoice includes setup services
T2,2026-09-15,680,Office chairs and delivery,Office supplies,Prior treatment may not fit equipment
T3,2026-09-18,2400,Annual professional membership,Membership expense,Period allocation question
T4,2026-09-21,310,Client entertainment receipt,Meals and entertainment,Reviewer policy required$r$
      )
    ) end
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='payment_controls'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','payment_controls','kind','policy','title','Cedar Lane payment-preparation and approval matrix',
        'content',$r$VA: may prepare the payment batch, collect invoice/approval evidence, perform duplicate checks, and flag bank-detail changes.
Finance Manager: approves supplier setup/bank changes after independent verification and approves the payment batch.
Director: releases payment in the banking platform for amounts above the internal threshold.
No one should approve a bank-detail change solely from the same email that requested it.
A due date, supplier pressure, or prior payment history does not override a missing control.$r$
      )
    ) end
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='source_docs'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','source_docs','kind','document','title','Cedar Lane source-document notes',
        'content',$r$North Tools NT-884 appears twice in the AP import for 2,450. One copy came from email and one from the accounting import. The supplier also requested new bank details in the email.
Green Office GO-119 for 680 has invoice, PO and approval evidence complete.
Metro IT MI-554 for 1,320 has the invoice but no purchase-order evidence and the supplier statement for month-end is still missing.
Cloud subscription bank line 89 has no corresponding book record in the supplied file.
Customer deposit 2,200 has no reliable invoice reference in the bank description.$r$
      )
    ) end,
  updated_at=now()
from public.training_courses c
where a.course_id=c.id
  and c.slug='bookkeeping-administration'
  and a.is_published=true;

update public.training_assessments a
set resource_pack =
  a.resource_pack
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='timesheet_detail'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','timesheet_detail','kind','csv','title','Harbor & Field timesheet and cutoff detail',
        'content',$r$employee,regular_hours,overtime_hours,submitted,manager_approval,issue
E014,38,8,2026-09-29 09:20,Missing,Approval missing before cutoff
E021,40,0,2026-09-29 10:05,Approved,New starter tax form still missing
E027,40,2,2026-09-29 08:55,Approved,New bank details received by email
E031,40,0,2026-09-29 11:30,Approved,Backdated pay increase request pending HR approval
E038,36,0,2026-09-29 09:40,Approved,Employee says 4 hours are missing
E044,40,14,2026-09-29 12:15,Approved,Late submission and unusually high overtime$r$
      )
    ) end
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='employee_changes'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','employee_changes','kind','csv','title','Harbor & Field employee-change register',
        'content',$r$employee,change_type,effective_date,source,approval,status
E006,Pay increase,2026-10-01,Signed salary letter,HR approved,Next cycle
E021,New starter,2026-09-28,Onboarding record,Manager approved,Tax form missing
E027,Bank account change,2026-09-30,Employee email,Not independently verified,Hold
E031,Backdated pay increase,2026-09-01,Manager email,HR approval missing,Hold
E052,Leaver,2026-09-30,HR termination notice,HR approved,Needs final-period review$r$
      )
    ) end
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='pay_components'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','pay_components','kind','csv','title','Harbor & Field pay-input review sample',
        'content',$r$employee,component,amount_or_hours,source,approved_rule,issue
E014,Overtime,8 hours,Timesheet,Manager approval required,Approval missing
E018,Travel allowance,240,Expense/pay input,None on employee record,Classification review needed
E025,Bonus,1500,Bonus approval sheet,Director approved,New component this period
E031,Base pay adjustment,800,Manager request,HR/payroll approval required,Approval incomplete
E038,Regular hours,36 hours,Timesheet,Standard hours 40,Employee query says 4 hours omitted$r$
      )
    ) end
  || case when exists (
      select 1 from jsonb_array_elements(a.resource_pack) r where r->>'id'='post_payroll'
    ) then '[]'::jsonb else jsonb_build_array(
      jsonb_build_object(
        'id','post_payroll','kind','document','title','Harbor & Field post-payroll reconciliation and employee-query file',
        'content',$r$Draft payroll total: 103,800
Approved payroll version: not yet final because bank verification for E027 and HR approval for E031 are open.
Prior comparable payroll total: 93,500.
Overtime increase is concentrated in E014 and E044; E014 lacks manager approval.
Bonus line 4,200 includes approved E025 amount plus other entries requiring reviewer trace.
Employee E038 reports four missing hours after reviewing the draft.
Payment file must not be treated as final until final payroll approval occurs.
If a correction is approved after final approval, change control and reapproval are required before payment release.$r$
      )
    ) end,
  updated_at=now()
from public.training_courses c
where a.course_id=c.id
  and c.slug='payroll-administration'
  and a.is_published=true;

update public.training_courses
set content_version=content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
where slug in ('bookkeeping-administration','payroll-administration');
