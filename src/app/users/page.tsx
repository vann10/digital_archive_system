import { getUsers } from "../../app/actions/users";
import UserTableClient from "@/src/components/user/user-table";
import { PageHeader } from "../../components/ui/page-header";
import { Separator } from "../../components/ui/separator";

export default async function ManajemenUserPage() {
  const { data: users } = await getUsers();
  
  const mappedUsers = users?.map(user => ({
    id: user.id,
    username: user.username,
    password: user.password,
    role: user.role,
  })) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen User"
        description="Kelola akses pengguna, password, dan role aplikasi."
      />
      <Separator />
      <UserTableClient initialUsers={mappedUsers} />
    </div>
  );
}