export type ColumnConfig = {
  /** Unique id for grid column */
  key: string;
  /** Header text */
  header: string;
  /** Path to value inside a row (relative to entire row object) */
  path: string; // e.g. "title", "raw.Title", "raw.cells[0]"
  width?: number;
  flex?: number;
};

export type BacklogMap = {
  titlePath: string;
  descriptionPath?: string;
  priorityPath?: string;
  assigneePath?: string;
  acceptanceCriteriaField?: string;
};

export type DetailsField = { label: string; path: string };

export type TabConfig = {
  /** columns to show in the grid */
  columns: ColumnConfig[];
  /** which fields to show in the details dialog */
  details: DetailsField[];
  /** how to map to backlog payload */
  backlog: BacklogMap;

  optionColumns: { displayName: string; internalName: string }[];
};

/* --------- SAMPLE CONFIGS (tune these) ---------- */

// Loop table parsed to BacklogRow where:
// - title at row.title
// - description at row.description
// - original cells in row.raw (array)
export const LOOP_TAB_CONFIG: TabConfig = {
  columns: [
    { key: "colTitle", header: "Task Title", path: "title", flex: 1 },
    { key: "colDesc", header: "Description", path: "description", flex: 1 },
  ],
  details: [
    { label: "Task Title", path: "title" },
    { label: "Description", path: "description" },
    { label: "Raw", path: "raw" },
  ],
  backlog: {
    titlePath: "title",
    descriptionPath: "description",
    assigneePath: "assignee",
  },
  optionColumns: [],
};

// SharePoint list item rows where the full SP item is in row.raw
// Adjust the internal names below to your list
export const SP_TAB_CONFIG: TabConfig = {
  columns: [
    { key: "cTitle", header: "Title", path: "raw.Title", flex: 1 },
    {
      key: "cAuthor",
      header: "Author",
      path: "raw.Author.Title",
      width: 180,
    },
    { key: "cCreated", header: "Created", path: "raw.Created", width: 180 },
  ],
  details: [
    { label: "Title", path: "raw.Title" },
    { label: "Description", path: "raw.Body" }, // change if you have a multi-line column
    { label: "Assignee", path: "raw.Author.Title" },
  ],
  backlog: {
    titlePath: "raw.Title",
    descriptionPath: "raw.Body",
    assigneePath: "raw.Author.Title",
    acceptanceCriteriaField: "",
  },
  optionColumns: [
    {
      displayName: "Title",
      internalName: "Title",
    },
    {
      displayName: "Created",
      internalName: "Created",
    },
  ],
};
