export type BacklogRow = {
  id: string;
  title: string;
  description?: string;
  creator?: string;
  created?: string;
  raw?: any; // keep original for details
};
