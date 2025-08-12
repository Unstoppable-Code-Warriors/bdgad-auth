import { getRoles } from "@/lib/actions/roles";
import RolesTable from "./_components/roles-table";
import { FetchLimit } from "@/lib/constants";

const RolesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const { page } = await searchParams;
  const { roles, total, totalPages } = await getRoles({
    limit: FetchLimit.ROLES,
    page: parseInt(page as string) || 1,
  });

  return <RolesTable roles={roles} total={total} totalPages={totalPages} />;
};

export default RolesPage;
