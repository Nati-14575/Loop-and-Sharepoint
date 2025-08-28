import {
  SP_LIST_TITLE,
  SP_LIST_TITLE2,
  SP_LIST_URL,
  SP_LIST_URL2,
} from "./config";
export type PathInput = string | string[];
export type ColumnConfig = {
  key: string; // unique ID for grid
  header: string; // UI label
  path: string; // where to resolve the value from row (e.g. "title", "raw.Title")
  width?: number;
  flex?: number;
};

// export type BacklogMap = {
//   titlePath: PathInput;
//   descriptionPath?: PathInput;
//   priorityPath?: PathInput;
//   assigneePath?: PathInput;
// };

export type DetailsField = { label: string; path: string };

export type TabConfig = {
  columns: ColumnConfig[]; // what to show in the grid
  details: DetailsField[]; // what to show in details dialog
  optionColumns: { displayName: string; internalName: string }[];
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
  listTitle: string; // SP list name
  siteUrl: string; // SP site
  titlePath: string | string[]; // which field(s) to use for normalized `title`
  descriptionPath?: string | string[]; // same for `description`
  creatorPath: string | string[]; // same for creator/business POC
  expand?: string[]; // SP expand fields
  selectExtra?: string[]; // SP select fields
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
export type UserListConfig = {
  listTitle: string;
  tabName: string;
  siteUrl: string;
  expand?: string[];
  selectExtra?: string[];
  // how SP fields map to your system
  mapping: Record<string, string[]>;
  systemColumns: {
    key: string;
    displayName: string;
  }[];
  extraFields?: string[];
};
