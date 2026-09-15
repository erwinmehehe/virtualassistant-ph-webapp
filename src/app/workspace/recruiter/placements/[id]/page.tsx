import { redirect } from "next/navigation";

export default async function RecruiterPlacementRedirect({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  redirect(`/workspace/client-success/${id}`);
}
