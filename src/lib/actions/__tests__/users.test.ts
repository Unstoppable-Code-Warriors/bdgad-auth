import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUsers } from "../users";
import { db } from "../../../db/drizzle";
import { sendPasswordEmailsToUsers } from "../../utils/email";

// Mock the database and email functions
vi.mock("../../../db/drizzle", () => ({
  db: {
    transaction: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("../../utils/email", () => ({
  sendPasswordEmailsToUsers: vi.fn(),
}));

describe("createUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error for empty email", async () => {
    const invalidInputs = [
      {
        email: "",
        name: "User 1",
        metadata: { phone: "1234567890", address: "Address 1" },
        roleIds: [1],
      },
    ];

    await expect(createUsers(invalidInputs)).rejects.toThrow("Email is required");
  });

  it("should throw error for null name", async () => {
    const invalidInputs = [
      {
        email: "user1@example.com",
        name: null,
        metadata: { phone: "1234567890", address: "Address 1" },
        roleIds: [1],
      },
    ];

    await expect(createUsers(invalidInputs)).rejects.toThrow("Name is required");
  });

  it("should throw error for null email", async () => {
    const invalidInputs = [
      {
        email: null,
        name: "User 2",
        metadata: { phone: "0987654321", address: "Address 2" },
        roleIds: [2],
      },
    ];

    await expect(createUsers(invalidInputs)).rejects.toThrow("Email is required");
  });

  it("should throw error for empty roleIds array", async () => {
    const invalidInputs = [
      {
        email: "user3@example.com",
        name: "User 3",
        metadata: { phone: "1112223333", address: "Address 3" },
        roleIds: [],
      },
    ];

    await expect(createUsers(invalidInputs)).rejects.toThrow("At least one role is required");
  });

  it("should throw error for duplicate emails in batch", async () => {
    const invalidInputs = [
      {
        email: "duplicate@example.com",
        name: "User 4",
        metadata: { phone: "2223334444", address: "Address 4" },
        roleIds: [3],
      },
      {
        email: "duplicate@example.com",
        name: "User 5",
        metadata: { phone: "5556667777", address: "Address 5" },
        roleIds: [3],
      },
    ];

    await expect(createUsers(invalidInputs)).rejects.toThrow("Duplicate emails found in batch");
  });

  it("should throw error for duplicate phone numbers in batch", async () => {
    const invalidInputs = [
      {
        email: "user6@example.com",
        name: "User 6",
        metadata: { phone: "0999888777", address: "Address 6" },
        roleIds: [4],
      },
      {
        email: "user7@example.com",
        name: "User 7",
        metadata: { phone: "0999887777", address: "Address 7" },
        roleIds: [4],
      },
    ];

    await expect(createUsers(invalidInputs)).rejects.toThrow("Duplicate phone numbers found in batch");
  });

  it("should throw error for role ID greater than 5", async () => {
    const invalidInputs = [
      {
        email: "user8@example.com",
        name: "User 8",
        metadata: { phone: "4443332222", address: "Address 8" },
        roleIds: [10],
      },
    ];

    await expect(createUsers(invalidInputs)).rejects.toThrow("Role ID must be between 1 and 5");
  });

  it("should throw error for missing required metadata fields", async () => {
    const invalidInputs = [
      {
        email: "user9@example.com",
        name: "User 9",
        metadata: {},
        roleIds: [2],
      },
    ];

    await expect(createUsers(invalidInputs)).rejects.toThrow("Phone number is required");
  });

  it("should throw error for duplicate names in batch", async () => {
    const invalidInputs = [
      {
        email: "user10@example.com",
        name: "UserX",
        metadata: { phone: "7775554444", address: "Address 10" },
        roleIds: [1],
      },
      {
        email: "user11@example.com",
        name: "UserX",
        metadata: { phone: "8889990000", address: "Address 11" },
        roleIds: [1],
      },
    ];

    await expect(createUsers(invalidInputs)).rejects.toThrow("Duplicate names found in batch");
  });

  it("should throw error for existing email in database", async () => {
    const invalidInputs = [
      {
        email: "existing@example.com",
        name: "New User",
        metadata: { phone: "0123456789", address: "Some address" },
        roleIds: [1],
      },
    ];

    // Mock database to return existing user
    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      return callback({
        select: vi.fn().mockResolvedValue([{ id: 1 }]),
      });
    });

    (db.transaction as any).mockImplementation(mockTransaction);

    await expect(createUsers(invalidInputs)).rejects.toThrow("Email already exists in the system");
  });

  it("should successfully create 50 users with valid data", async () => {
    const validInputs = Array.from({ length: 50 }, (_, i) => ({
      email: `user${i + 1}@example.com`,
      name: `User ${i + 1}`,
      metadata: {
        phone: `09000000${(i + 1).toString().padStart(2, '0')}`,
        address: `Address ${i + 1}`
      },
      roleIds: [Math.floor(i / 10) + 1], // Role IDs 1-5 distributed evenly
      status: "active" as const
    }));

    // Mock successful database transaction
    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      return callback({
        insert: vi.fn().mockResolvedValue(validInputs.map((input, index) => ({
          id: index + 1,
          ...input,
          createdAt: new Date(),
          updatedAt: new Date()
        }))),
        select: vi.fn().mockResolvedValue([]),
      });
    });

    (db.transaction as any).mockImplementation(mockTransaction);
    (sendPasswordEmailsToUsers as any).mockResolvedValue(undefined);

    const result = await createUsers(validInputs);

    expect(result).toHaveLength(50);
    expect(result[0].user.email).toBe("user1@example.com");
    expect(result[49].user.email).toBe("user50@example.com");
    expect(sendPasswordEmailsToUsers).toHaveBeenCalledWith(result);
  });

  it("should successfully create 55 users with valid data", async () => {
    const validInputs = Array.from({ length: 55 }, (_, i) => ({
      email: `user${i + 1}@example.com`,
      name: `User ${i + 1}`,
      metadata: {
        phone: `09110000${(i + 1).toString().padStart(2, '0')}`,
        address: `Location ${i + 1}`
      },
      roleIds: [Math.floor(i / 11) + 1], // Role IDs 1-5 distributed evenly
      status: "active" as const
    }));

    // Mock successful database transaction
    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      return callback({
        insert: vi.fn().mockResolvedValue(validInputs.map((input, index) => ({
          id: index + 1,
          ...input,
          createdAt: new Date(),
          updatedAt: new Date()
        }))),
        select: vi.fn().mockResolvedValue([]),
      });
    });

    (db.transaction as any).mockImplementation(mockTransaction);
    (sendPasswordEmailsToUsers as any).mockResolvedValue(undefined);

    const result = await createUsers(validInputs);

    expect(result).toHaveLength(55);
    expect(result[0].user.email).toBe("user1@example.com");
    expect(result[54].user.email).toBe("user55@example.com");
    expect(sendPasswordEmailsToUsers).toHaveBeenCalledWith(result);
  });
});