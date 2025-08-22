import {
  SP_LIST_TITLE,
  SP_LIST_TITLE2,
  SP_LIST_URL,
  SP_LIST_URL2,
} from "./config";
export type PathInput = string | string[];
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
  titlePath: PathInput;
  descriptionPath?: PathInput;
  priorityPath?: PathInput;
  assigneePath?: PathInput;
};

export type DetailsField = { label: string; path: string };

export type TabConfig = {
  /** columns to show in the grid */
  columns: ColumnConfig[];
  /** which fields to show in the details dialog */
  details: DetailsField[];
  /** how to map to backlog payload */

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

  optionColumns: [],
};

// SharePoint list item rows where the full SP item is in row.raw
// Adjust the internal names below to your list
export const SP_TAB_CONFIG: TabConfig = {
  columns: [
    { key: "cTitle", header: "Title", path: "title", flex: 1 },
    {
      key: "cAuthor",
      header: "Author",
      path: "raw.Author.Title",
      width: 180,
    },
    {
      key: "cDescription",
      header: "Description",
      path: "description",
      width: 180,
    },
    { key: "cCreated", header: "Created", path: "raw.Created", width: 180 },
  ],
  details: [
    { label: "Title", path: "raw.Title" },
    { label: "Description", path: "raw.Body" }, // change if you have a multi-line column
    { label: "Assignee", path: "raw.Author.Title" },
  ],
  optionColumns: [
    {
      displayName: "Title",
      internalName: "title",
    },
    {
      displayName: "Description",
      internalName: "description",
    },
    {
      displayName: "Created",
      internalName: "Created",
    },
    {
      displayName: "Creator",
      internalName: "creator",
    },
  ],
};
export type ListFieldConfig = {
  listTitle: string;
  siteUrl: string;

  /** one or more paths to compose the normalized title */
  titlePath: string | string[];
  /** one or more paths to compose the normalized description */
  descriptionPath?: string | string[];
  /** one or more paths to compose the normalized creator (e.g., Business POC) */
  creatorPath: string | string[];

  expand?: string[];
  selectExtra?: string[];
};
export const LIST_FIELD_CONFIG: ListFieldConfig[] = [
  {
    listTitle: SP_LIST_TITLE,
    siteUrl: SP_LIST_URL,
    titlePath: "Title",
    descriptionPath: ["Description", "Title"],
    creatorPath: "Author.Title",
    expand: ["Author"],
    selectExtra: ["Author/Title"],
  },
  {
    listTitle: SP_LIST_TITLE2,
    siteUrl: SP_LIST_URL2,
    titlePath: "TaskList2Title",
    descriptionPath: ["TaskList2Description", "Title"],
    creatorPath: "Author.Title",
    expand: ["Author"],
    selectExtra: ["Author/Title"],
  },
];
