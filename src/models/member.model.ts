export interface Member {
  id: string;
  name: string;
  email: string;
  githubUsername: string;
  orgName: string;
  joinReason: string;
  codingLevel: "beginner" | "intermediate" | "advanced";
}
