export type TrainingJoinState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: {
    full_name?: string;
    email?: string;
    password?: string;
  };
  attempt: number;
  email?: string;
  next?: string;
  courseTitle?: string | null;
  emailSent?: boolean;
};

export const initialTrainingJoinState: TrainingJoinState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  attempt: 0,
};
