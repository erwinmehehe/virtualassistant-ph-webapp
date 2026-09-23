export type RoleReadinessAttentionInput = {
  recruiter_id:string|null;
  service_model:string|null;
  age_hours:number;
};

export function roleReadinessMissingLabel(value:string){
  if(value==="start timing") return "preferred start";
  if(value==="budget") return "VA budget";
  return value;
}

export function adminRoleReadinessNeedsAttention(item:RoleReadinessAttentionInput){
  return !item.recruiter_id || item.age_hours>=72 || item.service_model==="managed_service";
}
