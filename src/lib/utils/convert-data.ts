import { GetRolesResult } from "../actions/roles";
import { CreateUserInput } from "../actions/users";
type RawUserData = {
  Name: string;
  Email: string;
  Role: number;
  Phone: string;
  Address: string;
};
function convertRawUsersToCreateUserInput(
  rawUsers: RawUserData[],
  roles: GetRolesResult["roles"]
): CreateUserInput[] {
  // Create a map from role code to role id for quick lookup
  const roleCodeToIdMap = new Map<string, number>();

  roles.forEach((role) => {
    if (role.code) {
      roleCodeToIdMap.set(role.code, role.id);
    }
  });

  console.log("Role mapping:", Object.fromEntries(roleCodeToIdMap));

  const convertedUsers = rawUsers.map((rawUser, index) => {
    // Convert Role (number) to string to match with role code
    const roleCode = rawUser.Role.toString();

    // Find the role ID based on the role code
    const roleId = roleCodeToIdMap.get(roleCode);

    if (!roleId) {
      console.warn(
        `Warning: Role code "${roleCode}" not found in roles for user ${rawUser.Name}`
      );
    }

    const convertedUser: CreateUserInput = {
      email: rawUser.Email,
      name: rawUser.Name,
      metadata: {
        phone: rawUser.Phone || null,
        address: rawUser.Address || null,
      },
      roleIds: roleId ? [roleId] : [], // Array with single role ID, or empty if not found
    };

    console.log(`User ${index + 1}:`, {
      original: rawUser,
      converted: convertedUser,
      foundRoleId: roleId || "NOT FOUND",
    });

    return convertedUser;
  });

  return convertedUsers;
}

export default convertRawUsersToCreateUserInput;
