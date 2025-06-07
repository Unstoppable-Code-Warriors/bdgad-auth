import { getUsers } from "@/lib/actions/users"
import UsersTable from "./_components/users-table"
import { FetchLimit } from "@/lib/constants"

const UsersPage = async ({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
	const { page } = await searchParams
	const { users, total, totalPages } = await getUsers({
		limit: FetchLimit.USERS,
		page: parseInt(page as string) || 1,
	})

	return <UsersTable users={users} total={total} totalPages={totalPages} />
}

export default UsersPage
