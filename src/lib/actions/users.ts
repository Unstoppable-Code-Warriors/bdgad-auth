"use server";

import { db } from "@/db/drizzle";
import { users, userRoles, roles } from "@/db/schema";
import { count, eq, getTableColumns, or, ilike, inArray, and, not, sql, desc } from "drizzle-orm";
import { withAuth } from "@/lib/utils/auth";
import bcrypt from "bcryptjs";
import { FetchLimit } from "../constants";
import {
  sendPasswordEmail,
  sendPasswordEmailsToUsers,
  sendRoleChangeEmail,
  sendDeletionEmail,
} from "@/lib/utils/email";

// Define the type for user with roles
type UserWithRoles = Omit<typeof users.$inferSelect, "password"> & {
  roles: Array<{
    id: number;
    name: string;
    description: string;
  }>;
};

// Type for batch user creation input
export type CreateUserInput = {
  email: string;
  name: string;
  metadata: Record<string, any>;
  roleIds?: number[];
  status?: "active" | "inactive";
};

// Type for user creation result with password
type UserCreationResult = {
  user: Omit<typeof users.$inferSelect, "password">;
  generatedPassword: string;
};

async function getUsersCore({
  limit = FetchLimit.USERS,
  page = 1,
  search,
}: {
  limit?: number;
  page?: number;
  search?: string;
} = {}) {
  try {
    console.log("Validating pagination parameters:", { limit, page });

    // Validate limit if provided
    if (limit !== undefined) {
      if (typeof limit !== "number") {
        throw new Error("Limit must be a number");
      }
      if (limit <= 0) {
        throw new Error("Limit must be greater than 0");
      }
    }

    // Validate page if provided
    if (page !== undefined) {
      if (typeof page !== "number") {
        throw new Error("Page must be a number");
      }
      if (page <= 0) {
        throw new Error("Page must be greater than 0");
      }
    }

    const offset = (page - 1) * limit;

    const { password, ...userColumns } = getTableColumns(users);

    const result = await db.transaction(async (tx) => {
      // Build the base query
      const baseQuery = tx
        .select({
          ...userColumns,
          roleId: userRoles.roleId,
          roleName: roles.name,
          roleDescription: roles.description,
        })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .orderBy(desc(users.createdAt));

      // Get users with their roles
      const usersWithRoles = search
        ? await baseQuery
            .where(
              or(
                ilike(users.name, `%${search}%`),
                ilike(users.email, `%${search}%`)
              )
            )
            .limit(limit)
            .offset(offset)
        : await baseQuery.limit(limit).offset(offset);

      // Group roles by user
      const userMap = new Map<number, UserWithRoles>();

      usersWithRoles.forEach((row) => {
        const userId = row.id;
        if (!userMap.has(userId)) {
          const { roleId, roleName, roleDescription, ...userData } = row;
          userMap.set(userId, {
            ...userData,
            roles: [],
          });
        }

        // Add role if it exists (leftJoin might return null roles for users without roles)
        if (row.roleId && row.roleName && row.roleDescription) {
          userMap.get(userId)!.roles.push({
            id: row.roleId,
            name: row.roleName,
            description: row.roleDescription,
          });
        }
      });

      const userList: UserWithRoles[] = Array.from(userMap.values());

      // Get total count with search condition
      const totalResult = search
        ? await tx
            .select({ count: count() })
            .from(users)
            .where(
              or(
                ilike(users.name, `%${search}%`),
                ilike(users.email, `%${search}%`)
              )
            )
        : await tx.select({ count: count() }).from(users);

      return {
        users: userList,
        total: totalResult[0].count,
        totalPages: Math.ceil(totalResult[0].count / limit),
      };
    });

    return result;
  } catch (error) {
    console.error("Error in getUsersCore:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export const getUsers = withAuth(getUsersCore);
export type GetUsersResult = Awaited<ReturnType<typeof getUsers>>;

// Validation functions
const validateEmail = (email: string): void => {
  console.log("Validating email:", email);
  if (!email || typeof email !== "string") {
    throw new Error("Email is required");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error("Invalid email format");
  }
};

const validateName = (name: string): void => {
  console.log("Validating name:", name);
  if (!name || typeof name !== "string") {
    throw new Error("Name is required");
  }
  const trimmedName = name.trim();
  if (trimmedName.length < 1 || trimmedName.length > 50) {
    throw new Error("Name must be between 1 and 50 characters");
  }
  // Allow Vietnamese characters, letters, and single spaces
  if (!/^[a-zA-ZÀ-ỹ]+( [a-zA-ZÀ-ỹ]+)*$/.test(trimmedName)) {
    throw new Error("Name can only contain letters (including Vietnamese) and single spaces between words");
  }
};

const validatePhone = (phone: string | undefined): void => {
  if (!phone) return; // Phone is optional
  console.log("Validating phone:", phone);
  if (!/^\d{10}$/.test(phone)) {
    throw new Error("Phone must be exactly 10 digits");
  }
};

const validateAddress = (address: string | undefined): void => {
  if (!address) return; // Address is optional
  console.log("Validating address:", address);
  if (address.length > 200) {
    throw new Error("Address must not exceed 200 characters");
  }
  if (!/^[a-zA-ZÀ-ỹ0-9\s\(\)\|\/\-\,\.]+$/.test(address)) {
    throw new Error("Address can only contain letters (including Vietnamese), numbers, spaces, and the following special characters: ( ) | / - , .");
  }
};

const validateRoleIds = async (roleIds: number[]): Promise<void> => {
  console.log("Validating role IDs:", roleIds);
  if (!roleIds || roleIds.length === 0) {
    throw new Error("At least one role is required");
  }

  const existingRoles = await db
    .select({ id: roles.id })
    .from(roles)
    .where(inArray(roles.id, roleIds));

  const existingRoleIds = existingRoles.map(role => role.id);
  const invalidRoleIds = roleIds.filter(id => !existingRoleIds.includes(id));

  if (invalidRoleIds.length > 0) {
    throw new Error(`Invalid role IDs: ${invalidRoleIds.join(", ")}`);
  }
};

const validateStatus = (status: string): void => {
  console.log("Validating status:", status);
  if (!["active", "inactive"].includes(status)) {
    throw new Error("Status must be either 'active' or 'inactive'");
  }
};

// Add new validation function for checking duplicate phone numbers
export const validatePhoneUniqueness = async (phone: string, userId: number): Promise<void> => {
  console.log("Validating phone uniqueness:", phone);
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(sql`${users.metadata}->>'phone'`, phone),
        not(eq(users.id, userId))
      )
    )
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Phone number already exists in the system");
  }
};

async function createUserCore({
  email,
  name,
  metadata,
  roleIds = [],
  status = "active",
}: {
  email: string;
  name: string;
  metadata: Record<string, any>;
  roleIds?: number[];
  status?: "active" | "inactive";
}) {
  try {
    // Validate email format
    validateEmail(email);

    // Check if email already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("Email already exists in the system");
    }

    // Validate name
    validateName(name);

    // Validate phone if present
    if (metadata?.phone) {
      validatePhone(metadata.phone);
      // Check if phone number already exists
      await validatePhoneUniqueness(metadata.phone, 0); // Pass 0 as userId since this is a new user
    }

    // Validate address if present
    validateAddress(metadata?.address);

    // Validate role IDs
    await validateRoleIds(roleIds);

    // Validate status
    validateStatus(status);

    // Generate a random password
    const generateRandomPassword = () => {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const generatedPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 12);

    const result = await db.transaction(async (tx) => {
      // Create the user
      const [{ password: hashedDbPassword, ...newUser }] = await tx
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name,
          metadata,
          status,
        })
        .returning();

      // Assign roles if provided
      if (roleIds.length > 0) {
        await tx.insert(userRoles).values(
          roleIds.map((roleId) => ({
            userId: newUser.id,
            roleId,
          }))
        );
      }

      // TODO: Send email with generated password to user
      // This would require an email service to be implemented
      try {
        await sendPasswordEmail(email, generatedPassword, name);
      } catch (emailError) {
        console.error("Failed to send password email:", emailError);
        // Don't throw here - user creation was successful, just email failed
        // The frontend will handle this case with appropriate messaging
      }

      return newUser;
    });

    return result;
  } catch (error) {
    console.error("Error in createUserCore:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export const createUser = withAuth(createUserCore);
export type CreateUserResult = Awaited<ReturnType<typeof createUser>>;

async function createUsersCore(userInputs: CreateUserInput[]) {
  try {
    // Validate all users first before proceeding with any creation
    for (const userInput of userInputs) {
      const { email, name, metadata, roleIds = [], status = "active" } = userInput;

      // Validate email format
      validateEmail(email);

      // Check if email already exists
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error(`Email already exists in the system: ${email}`);
      }

      // Validate name
      validateName(name);

      // Validate phone if present
      validatePhone(metadata?.phone);

      // Validate address if present
      validateAddress(metadata?.address);

      // Validate role IDs
      await validateRoleIds(roleIds);

      // Validate status
      validateStatus(status);
    }

    // Generate random password function
    const generateRandomPassword = () => {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const results: UserCreationResult[] = [];

    // Process each user in a transaction
    const finalResults = await db.transaction(async (tx) => {
      for (const userInput of userInputs) {
        const { email, name, metadata, roleIds = [], status = "active" } = userInput;

        // Generate password for this user
        const generatedPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 12);

        // Create the user
        const [{ password: hashedDbPassword, ...newUser }] = await tx
          .insert(users)
          .values({
            email,
            password: hashedPassword,
            name,
            metadata,
            status,
          })
          .returning();

        // Assign roles if provided
        if (roleIds.length > 0) {
          await tx.insert(userRoles).values(
            roleIds.map((roleId) => ({
              userId: newUser.id,
              roleId,
            }))
          );
        }

        results.push({
          user: newUser,
          generatedPassword,
        });
      }

      return results;
    });

    // Send emails to all created users
    try {
      await sendPasswordEmailsToUsers(finalResults);
    } catch (emailError) {
      console.error("Failed to send password emails:", emailError);
      // Don't throw here - user creation was successful, just email failed
    }

    return finalResults;
  } catch (error) {
    console.error("Error in createUsersCore:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export const createUsers = withAuth(createUsersCore);
export type CreateUsersResult = Awaited<ReturnType<typeof createUsers>>;

async function updateUserCore({
  id,
  email,
  password,
  name,
  metadata,
  roleIds,
  status,
}: {
  id: number;
  email?: string;
  password?: string;
  name?: string;
  metadata?: Record<string, any>;
  roleIds?: number[];
  status?: "active" | "inactive";
}) {
  try {
    // Validate phone if present
    if (metadata?.phone) {
      validatePhone(metadata.phone);
      await validatePhoneUniqueness(metadata.phone, id);
    }

    // Validate address if present
    if (metadata?.address) {
      validateAddress(metadata.address);
    }

    // Validate role IDs if present
    if (roleIds) {
      await validateRoleIds(roleIds);
    }

    // Validate status if present
    if (status) {
      validateStatus(status);
    }

    const result = await db.transaction(async (tx) => {
      // Prepare update data
      const updateData: any = {};

      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.name = name;
      if (metadata !== undefined) updateData.metadata = metadata;
      if (status !== undefined) updateData.status = status;
      if (password !== undefined) {
        updateData.password = await bcrypt.hash(password, 12);
      }

      // Get current user data for role comparison
      const currentUser = await tx
        .select({
          email: users.email,
          name: users.name,
          roles: roles.name,
        })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(users.id, id))
        .limit(1);

      // Update user if there's data to update
      let updatedUser;
      if (Object.keys(updateData).length > 0) {
        const [{ password: hashedDbPassword, ...user }] = await tx
          .update(users)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, id))
          .returning();
        updatedUser = user;
      } else {
        // If no user data to update, just get the current user
        const { password: hashedDbPassword, ...user } = await tx
          .select()
          .from(users)
          .where(eq(users.id, id))
          .then((rows) => rows[0]);
        updatedUser = user;
      }

      // Update roles if provided
      if (roleIds !== undefined) {
        // Get new role name for email notification
        const newRole = await tx
          .select({ name: roles.name })
          .from(roles)
          .where(eq(roles.id, roleIds[0]))
          .limit(1);

        // Delete existing roles
        await tx.delete(userRoles).where(eq(userRoles.userId, id));

        // Insert new roles if any
        if (roleIds.length > 0) {
          await tx.insert(userRoles).values(
            roleIds.map((roleId) => ({
              userId: id,
              roleId,
            }))
          );

          // Send email notification if role changed
          if (currentUser[0]?.roles !== newRole[0]?.name) {
            try {
              await sendRoleChangeEmail(
                currentUser[0].email,
                currentUser[0].name,
                newRole[0].name
              );
            } catch (emailError) {
              console.error("Failed to send role change notification:", emailError);
              // Don't throw here - role update was successful, just email failed
            }
          }
        }
      }

      return updatedUser;
    });

    return result;
  } catch (error) {
    console.error("Error in updateUserCore:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export const updateUser = withAuth(updateUserCore);
export type UpdateUserResult = Awaited<ReturnType<typeof updateUser>>;

async function deleteUserCore({ id, reason }: { id: number; reason?: string }) {
  try {
    console.log("Validating user ID for deletion:", id);

    // Validate that id is a number and not empty
    if (!id || typeof id !== "number") {
      throw new Error("Invalid user ID: must be a number");
    }

    // Get user details before deletion for email notification
    const userToDelete = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (userToDelete.length === 0) {
      throw new Error(`User with ID ${id} does not exist`);
    }

    await db.transaction(async (tx) => {
      // Delete user roles first (due to foreign key constraints)
      await tx.delete(userRoles).where(eq(userRoles.userId, id));

      // Then delete the user
      await tx.delete(users).where(eq(users.id, id));
    });

    // Send email notification
    try {
      await sendDeletionEmail(
        userToDelete[0].email,
        userToDelete[0].name,
        reason
      );
    } catch (emailError) {
      console.error("Failed to send deletion notification email:", emailError);
      // Don't throw here - user deletion was successful, just email failed
    }
  } catch (error) {
    console.error("Error in deleteUserCore:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
export const deleteUser = withAuth(deleteUserCore);
export type DeleteUserResult = Awaited<ReturnType<typeof deleteUser>>;

