/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  GitHubComment,
  GitHubContent,
  GitHubContributor,
  GitHubIssue,
  GitHubOrganizedComments,
  GitHubRawIssue,
} from "../../types/gitHub";
import api from "../../api/api";

export interface GitHubState {
  contents: GitHubContent[];
  issues: GitHubIssue;
  allIssues: GitHubRawIssue[];
  totalOpenIssues: number;
  readme: string | null;
  contributing: boolean;
  contributors: GitHubContributor[];
  loading: boolean;
  error: string | null;
  comments: GitHubComment[];
  organizedComments: GitHubOrganizedComments[];
}

const initialState: GitHubState = {
  contents: [],
  issues: {
    incomplete_results: false,
    items: [],
    total_count: 0,
  },
  allIssues: [],
  totalOpenIssues: 0,
  readme: null,
  contributing: false,
  organizedComments: [],
  contributors: [],
  comments: [],
  loading: false,
  error: null,
};

interface FetchGitHubIssuesParams {
  repoFullName: string;
  label: string[];
}

interface FetchGitHubCommentsParams {
  repoFullName: string;
  issueNumber: number;
}

export const fetchGitHubContents = createAsyncThunk(
  "gitHub/fetchContents",
  async (
    { repoFullName, token }: { repoFullName: string; token: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get(`/repos/${repoFullName}/contents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data as GitHubContent[];
    } catch {
      return rejectWithValue("Falha ao recuperar conteúdo do GitHub.");
    }
  },
);

export const fetchGitHubContributors = createAsyncThunk(
  "gitHub/fetchContributors",
  async (
    { repoFullName, token }: { repoFullName: string; token: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get(`/repos/${repoFullName}/contributors`, {
        params: { per_page: 100 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data as GitHubContributor[];
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 403) {
        try {
          const statsResponse = await api.get(
            `/repos/${repoFullName}/stats/contributors`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const mapped = (statsResponse.data as any[]).map((item) => ({
            login: item.author.login,
            avatar_url: item.author.avatar_url,
            contributions: item.total,
          })) as GitHubContributor[];
          return mapped;
        } catch  {
          return [] as GitHubContributor[];
        }
      }
      return rejectWithValue("Falha ao recuperar contribuidores do GitHub.");
    }
  },
);

export const fetchGitHubIssues = createAsyncThunk(
  "gitHub/fetchIssues",
  async (
    { label, repoFullName, token }: FetchGitHubIssuesParams & { token: string },
    { rejectWithValue },
  ) => {
    try {
      const formattedLabels = label
        .map((l) => (l.includes(" ") ? `"${l}"` : l))
        .join(",");

      const query = `repo:${repoFullName} is:issue state:open label:${formattedLabels}`;

      console.log("Search query:", query);

      const response = await api.get(`/search/issues`, {
        params: { q: query },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data as GitHubIssue;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      console.error("GitHub Search API Error:", message);
      return rejectWithValue(`Falha ao buscar issues: ${message}`);
    }
  },
);

export const fetchGitHubComments = createAsyncThunk(
  "gitHub/fetchComments",
  async (
    {
      issueNumber,
      repoFullName,
      token,
    }: FetchGitHubCommentsParams & { token: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get(
        `/repos/${repoFullName}/issues/${issueNumber}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data as GitHubComment[];
    } catch {
      return rejectWithValue("Falha ao recuperar comentários do GitHub.");
    }
  },
);

export const fetchReadme = createAsyncThunk(
  "gitHub/fetchReadme",
  async ({ repoFullName, token }: { repoFullName: string; token: string }) => {
    try {
      const response = await api.get(`/repos/${repoFullName}/readme`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(
        "README response:",
        atob(response.data.content.replace(/\s/g, "")),
      );
      return atob(response.data.content.replace(/\s/g, "")) as string;
    } catch {
      return null;
    }
  },
);

export const fetchContributing = createAsyncThunk(
  "gitHub/fetchContributing",
  async ({ repoFullName, token }: { repoFullName: string; token: string }) => {
    try {
      await api.get(`/repos/${repoFullName}/contents/CONTRIBUTING.md`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return true;
    } catch {
      try {
        await api.get(`/repos/${repoFullName}/contents/CONTRIBUTING`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return true;
      } catch {
        return false;
      }
    }
  },
);

export const fetchGitHubAllIssues = createAsyncThunk(
  "gitHub/fetchAllIssues",
  async (
    { repoFullName, token }: { repoFullName: string; token: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get(`/repos/${repoFullName}/issues`, {
        params: { state: "open", per_page: 100 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return (response.data as any[]).filter(
        (item) => !item.pull_request,
      ) as GitHubRawIssue[];
    } catch {
      return rejectWithValue("Falha ao recuperar issues.");
    }
  },
);

export const fetchTotalOpenIssues = createAsyncThunk(
  "gitHub/fetchTotalOpenIssues",
  async (
    { repoFullName, token }: { repoFullName: string; token: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get("/search/issues", {
        params: { q: `repo:${repoFullName} is:issue state:open`, per_page: 1 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.total_count as number;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue(`Falha ao contar issues: ${message}`);
    }
  },
);

export const verifyGitHubToken = createAsyncThunk(
  "gitHub/verifyToken",
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await api.get("/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.status === 200;
    } catch {
      return rejectWithValue("Token inválido.");
    }
  },
);

export const gitHubSlice = createSlice({
  name: "gitHub",
  initialState,
  reducers: {
    clearGitHubState: (state) => {
      state.contents = [];
      state.issues = {
        incomplete_results: false,
        items: [],
        total_count: 0,
      };
      state.allIssues = [];
      state.totalOpenIssues = 0;
      state.readme = null;
      state.contributing = false;
      state.contributors = [];
      state.comments = [];
      state.loading = false;
      state.organizedComments = [];
      state.error = null;
    },
    organizeCommentsByIdSection: (state) => {
      const recordOrganizedById: Record<number, GitHubComment[]> = {};
      state.comments.forEach((comment) => {
        const idUrl = comment.issue_url.split("/")[7];
        if (!recordOrganizedById[+idUrl]) {
          recordOrganizedById[+idUrl] = [];
        }
        if (recordOrganizedById[+idUrl].length < 2) {
          const hasEqualUser = recordOrganizedById[+idUrl].find(
            (item) => item.user.login === comment.user.login,
          );
          console.log(hasEqualUser);
          if (!hasEqualUser) {
            recordOrganizedById[+idUrl].push(comment);
          }
        }
      });
      state.organizedComments = Object.entries(recordOrganizedById).map(
        ([id, comments]) => {
          return {
            id: +id,
            comments,
          };
        },
      );
      console.log(state.comments);
      console.log(state.organizedComments);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGitHubContents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGitHubContents.fulfilled, (state, action) => {
        state.loading = false;
        state.contents = action.payload;
      })
      .addCase(fetchGitHubContents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchGitHubContributors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGitHubContributors.fulfilled, (state, action) => {
        state.loading = false;
        state.contributors = action.payload;
      })
      .addCase(fetchGitHubContributors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchGitHubIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGitHubIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = action.payload;
      })
      .addCase(fetchGitHubIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchGitHubComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGitHubComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = [...state.comments, ...action.payload];
      })
      .addCase(fetchGitHubComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder.addCase(fetchReadme.fulfilled, (state, action) => {
      state.readme = action.payload;
    });

    builder.addCase(fetchContributing.fulfilled, (state, action) => {
      state.contributing = action.payload ?? false;
    });

    builder
      .addCase(fetchGitHubAllIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGitHubAllIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.allIssues = action.payload;
      })
      .addCase(fetchGitHubAllIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder.addCase(fetchTotalOpenIssues.fulfilled, (state, action) => {
      state.totalOpenIssues = action.payload;
    });
  },
});

export const { clearGitHubState, organizeCommentsByIdSection } =
  gitHubSlice.actions;
export default gitHubSlice.reducer;
