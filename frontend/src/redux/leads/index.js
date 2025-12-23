import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { request } from '@/request';

// Async thunks for API calls
export const generateLeads = createAsyncThunk(
  'leads/generate',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await request.post({ entity: '/leads/generate', jsonData: searchParams });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to generate leads' });
    }
  }
);

export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async (params = {}, { rejectWithValue }) => {
    try {
      let query = '';
      if (Object.keys(params).length > 0) {
        query = '?';
        for (var key in params) {
          query += key + '=' + params[key] + '&';
        }
        query = query.slice(0, -1);
      }
      const response = await request.get({ entity: '/leads' + query });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch leads' });
    }
  }
);

export const deleteLead = createAsyncThunk(
  'leads/deleteLead',
  async (leadId, { rejectWithValue }) => {
    try {
      await request.delete({ entity: 'leads', id: leadId });
      return leadId;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete lead' });
    }
  }
);

export const fetchLeadStats = createAsyncThunk(
  'leads/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await request.get({ entity: '/leads/stats' });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch lead statistics' });
    }
  }
);

const initialState = {
  leads: [],
  stats: {
    totalLeads: 0,
    averageRating: 0,
    topBusinessTypes: []
  },
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0,
    pages: 0
  },
  loading: {
    generate: false,
    fetch: false,
    delete: false,
    stats: false
  },
  error: null,
  lastGeneration: null,
  searchFilters: {
    search: '',
    page: 1,
    limit: 20
  }
};

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    clearLeads: (state) => {
      state.leads = [];
      state.pagination = initialState.pagination;
    },
    resetState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Generate leads
      .addCase(generateLeads.pending, (state) => {
        state.loading.generate = true;
        state.error = null;
      })
      .addCase(generateLeads.fulfilled, (state, action) => {
        state.loading.generate = false;
        state.lastGeneration = action.payload.data;
        state.error = null;
      })
      .addCase(generateLeads.rejected, (state, action) => {
        state.loading.generate = false;
        state.error = action.payload?.message || 'Failed to generate leads';
      })
      
      // Fetch leads
      .addCase(fetchLeads.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.leads = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload?.message || 'Failed to fetch leads';
      })
      
      // Delete lead
      .addCase(deleteLead.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.leads = state.leads.filter(lead => lead._id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.error = null;
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload?.message || 'Failed to delete lead';
      })
      
      // Fetch stats
      .addCase(fetchLeadStats.pending, (state) => {
        state.loading.stats = true;
        state.error = null;
      })
      .addCase(fetchLeadStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload.data;
        state.error = null;
      })
      .addCase(fetchLeadStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload?.message || 'Failed to fetch lead statistics';
      });
  }
});

export const { clearError, setSearchFilters, clearLeads, resetState } = leadsSlice.actions;

// Selectors
export const selectLeads = (state) => state.leads.leads;
export const selectLeadStats = (state) => state.leads.stats;
export const selectLeadsPagination = (state) => state.leads.pagination;
export const selectLeadsLoading = (state) => state.leads.loading;
export const selectLeadsError = (state) => state.leads.error;
export const selectLastGeneration = (state) => state.leads.lastGeneration;
export const selectSearchFilters = (state) => state.leads.searchFilters;

export default leadsSlice.reducer;
