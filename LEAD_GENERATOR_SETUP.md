# Lead Generator Setup Guide

This guide explains how to set up and use the Lead Generator feature in IDURAR CRM.

## Overview

The Lead Generator feature allows you to:
- Search for businesses in specific locations using Google Maps Places API
- Filter businesses that have websites
- Store leads temporarily for 24 hours (auto-deleted for compliance)
- View lead statistics and manage your generated leads

## Prerequisites

1. **Google Cloud Account**: You need a Google Cloud account with billing enabled
2. **Google Maps API Key**: Places API must be enabled
3. **MongoDB**: Database should be running
4. **Node.js Dependencies**: All packages should be installed

## Setup Instructions

### 1. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Places API
   - Geocoding API (optional, for address-to-coordinates conversion)
4. Create an API key:
   - Go to "Credentials" in the API & Services section
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
5. (Optional) Restrict the API key:
   - Click on your API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API" and "Geocoding API"

### 2. Environment Configuration

1. Open `backend/.env` file
2. Add your Google Maps API key:
   ```
   GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
   ```
3. Make sure other required environment variables are set:
   ```
   DATABASE=mongodb://localhost:27017/your_database_name
   JWT_SECRET=your_private_jwt_secret_key
   ```

### 3. Install Dependencies

If not already installed, run:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies  
cd ../frontend
npm install
```

### 4. Start the Application

```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm run dev
```

## Usage Guide

### Accessing Lead Generator

1. Log into your IDURAR CRM dashboard
2. Click on "Lead Generator" in the left navigation menu
3. You'll see the Lead Generator interface with:
   - Statistics cards showing your current leads
   - Lead generation form
   - Your existing leads table

### Generating Leads

1. **Fill out the search form**:
   - **Location**: Enter a city, address, or coordinates (e.g., "New York, NY" or "40.7128,-74.0060")
   - **Search Radius**: Select distance in kilometers (1-50 km)
   - **Business Category**: Choose the type of businesses to search for

2. **Click "Generate Leads"**: The system will:
   - Search Google Maps for businesses in the specified area
   - Filter only businesses that have websites
   - Save the results to your leads database
   - Show a success message with the number of leads generated

3. **View Results**: Generated leads appear in the table below with:
   - Business name and rating
   - Contact information (website, phone, address)
   - Business types/categories
   - Date added

### Managing Leads

- **Search Leads**: Use the search box to filter your existing leads
- **Delete Leads**: Click the delete button to remove individual leads
- **Auto-Deletion**: All leads are automatically deleted after 24 hours for compliance

### Rate Limiting

- Maximum 10 lead generation requests per day per user
- This limit resets every 24 hours
- Rate limiting helps control API costs and prevents abuse

## API Endpoints

The following API endpoints are available:

- `POST /api/leads/generate` - Generate new leads
- `GET /api/leads` - Fetch user's leads (with pagination and search)
- `DELETE /api/leads/:id` - Delete a specific lead
- `GET /api/leads/stats` - Get lead statistics

## Compliance Features

### Google Maps API Compliance

- **Attribution**: "Powered by Google Maps" is displayed in the UI
- **Data Retention**: Leads are automatically deleted after 24 hours
- **Rate Limiting**: Prevents excessive API usage
- **No Permanent Storage**: Place data is not cached beyond the 24-hour limit

### Privacy Considerations

- Leads are associated with individual users
- No cross-user data sharing
- Automatic data expiration ensures privacy compliance

## Troubleshooting

### Common Issues

1. **"Google Maps API key not configured" Error**
   - Check that `GOOGLE_MAPS_API_KEY` is set in your `.env` file
   - Verify the API key is correct and has no extra spaces

2. **"Location not found" Error**
   - Try a more specific location (include city, state/country)
   - Use coordinates format: "latitude,longitude"

3. **"Too many requests" Error**
   - You've hit the daily limit of 10 requests
   - Wait 24 hours for the limit to reset

4. **No leads generated despite businesses found**
   - This means the businesses found don't have websites listed
   - Try a different location or business category
   - Some business types are less likely to have websites

### API Costs

Google Places API pricing (as of 2024):
- Nearby Search: ~$32 per 1,000 requests
- Place Details: ~$17 per 1,000 requests
- The feature limits to 50 results per search to control costs

### Performance Tips

1. **Use specific locations** for better results
2. **Choose appropriate business categories** for your target market
3. **Monitor your Google Cloud billing** to track API usage
4. **Use smaller search radius** for more targeted results

## Development Notes

### File Structure

```
backend/
├── src/
│   ├── models/appModels/Lead.js          # Lead data model
│   ├── controllers/appControllers/leadController.js  # API logic
│   └── routes/appRoutes/leadRoutes.js    # API routes

frontend/
├── src/
│   ├── pages/LeadGenerator/index.jsx     # Main UI component
│   ├── redux/leads/index.js              # State management
│   └── apps/Navigation/NavigationContainer.jsx  # Navigation menu
```

### Database Schema

The Lead model includes:
- User association
- Business information (name, address, phone, website)
- Google Places data (place_id, rating, business types)
- Search metadata (location, radius)
- TTL index for automatic deletion

### Security Features

- User authentication required for all endpoints
- Rate limiting per user
- Input validation and sanitization
- Error handling to prevent information leakage

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Check the backend logs for detailed error information
4. Ensure all environment variables are properly configured
