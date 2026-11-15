export type Role = "owner" | "editor" | "viewer";
export type ShareRole = "viewer" | "editor";

export type Collaborator = {
  userId: string;
  email: string;
  name: string;
  role: ShareRole;
};