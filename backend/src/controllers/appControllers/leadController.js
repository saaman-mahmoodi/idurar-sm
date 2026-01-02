const { Client } = require('@googlemaps/google-maps-services-js');
const supabase = require('@/config/supabase');
const { catchErrors } = require('@/handlers/errorHandlers');

const googleMapsClient = new Client({});

const leadController = {
  // Generate leads from Google Places API
  generate: async (req, res) => {
    try {
      const { location, radius, category = 'establishment' } = req.body;
      const userId = req.admin.id;

      if (!location || !radius) {
        return res.status(400).json({
          success: false,
          message: 'Location and radius are required'
        });
      }

      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({
          success: false,
          message: 'Google Maps API key not configured'
        });
      }

      // Geocode location if it's not coordinates
      let coordinates;
      if (typeof location === 'string') {
        const geocodeResponse = await googleMapsClient.geocode({
          params: {
            address: location,
            key: process.env.GOOGLE_MAPS_API_KEY
          }
        });

        if (geocodeResponse.data.results.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Location not found'
          });
        }

        coordinates = geocodeResponse.data.results[0].geometry.location;
      } else {
        coordinates = location;
      }

      // Search for nearby places
      const placesResponse = await googleMapsClient.placesNearby({
        params: {
          location: coordinates,
          radius: radius * 1000, // Convert km to meters
          type: category,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      const places = placesResponse.data.results;
      const leadsToSave = [];
      
      console.log(`Found ${places.length} places near ${typeof location === 'string' ? location : `${coordinates.lat}, ${coordinates.lng}`} within ${radius}km`);

      // Process each place and get details
      for (const place of places) {
        try {
          // Get place details to check for website
          const detailsResponse = await googleMapsClient.placeDetails({
            params: {
              place_id: place.place_id,
              fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'user_ratings_total', 'types', 'url'],
              key: process.env.GOOGLE_MAPS_API_KEY
            }
          });

          const details = detailsResponse.data.result;

          // Only include businesses WITHOUT websites
          // Check for website, url, or any truthy website-related field
          const websiteValue = details.website;
          const urlValue = details.url;
          
          // Check if website field has a valid website (not "undefined" string)
          const hasValidWebsite = websiteValue && 
                                 typeof websiteValue === 'string' && 
                                 websiteValue.trim() !== '' && 
                                 websiteValue.toLowerCase() !== 'null' &&
                                 websiteValue.toLowerCase() !== 'undefined';
          
          // Check if URL field has a valid website (not Google Maps URLs)
          const hasValidUrl = urlValue && 
                             typeof urlValue === 'string' && 
                             urlValue.trim() !== '' &&
                             urlValue.toLowerCase() !== 'null' &&
                             urlValue.toLowerCase() !== 'undefined' &&
                             !urlValue.includes('maps.google.com') &&
                             !urlValue.includes('google.com/maps');
          
          const hasWebsite = hasValidWebsite || hasValidUrl;
          
          console.log(`Business: ${details.name}, Website: "${websiteValue}", URL: "${urlValue}", Has Website: ${hasWebsite}`);
          
          if (!hasWebsite) {
            leadsToSave.push({
              userId,
              businessName: details.name,
              address: details.formatted_address,
              phone: details.formatted_phone_number,
              website: null, // No website available
              placeId: place.place_id,
              rating: details.rating,
              userRatingsTotal: details.user_ratings_total,
              businessTypes: details.types,
              location: place.geometry.location,
              searchLocation: typeof location === 'string' ? location : `${coordinates.lat}, ${coordinates.lng}`,
              searchRadius: radius
            });
          }

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error fetching details for place ${place.place_id}:`, error.message);
          continue;
        }
      }

      console.log(`Processed ${places.length} places, found ${leadsToSave.length} businesses without websites`);

      // Save leads to database
      if (leadsToSave.length > 0) {
        const { error: insertError } = await supabase
          .from('leads')
          .insert(leadsToSave.map(lead => ({
            user_id: lead.userId,
            business_name: lead.businessName,
            address: lead.address,
            phone: lead.phone,
            website: lead.website,
            place_id: lead.placeId,
            rating: lead.rating,
            user_ratings_total: lead.userRatingsTotal,
            business_types: lead.businessTypes,
            location: lead.location,
            search_location: lead.searchLocation,
            search_radius: lead.searchRadius
          })));
        
        if (insertError) {
          console.error('Error saving leads:', insertError);
          throw insertError;
        }
        console.log(`Successfully saved ${leadsToSave.length} leads to database`);
      } else {
        console.log('No leads to save - all businesses found have websites');
      }

      res.json({
        success: true,
        message: `Generated ${leadsToSave.length} leads`,
        data: {
          totalFound: places.length,
          leadsGenerated: leadsToSave.length,
          searchLocation: typeof location === 'string' ? location : `${coordinates.lat}, ${coordinates.lng}`,
          searchRadius: radius
        }
      });

    } catch (error) {
      console.error('Lead generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate leads',
        error: error.message
      });
    }
  },

  // Get user's leads
  list: async (req, res) => {
    try {
      const userId = req.admin.id;
      const { page = 1, limit = 20, search } = req.query;

      const query = { userId };
      
      if (search) {
        query.$or = [
          { businessName: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          { website: { $regex: search, $options: 'i' } }
        ];
      }

      let supabaseQuery = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        supabaseQuery = supabaseQuery.or(`business_name.ilike.%${search}%,address.ilike.%${search}%,website.ilike.%${search}%`);
      }

      const { data: leads, error, count: total } = await supabaseQuery;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: leads,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leads',
        error: error.message
      });
    }
  },

  // Delete a specific lead
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.admin.id;

      const { data: lead, error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      res.json({
        success: true,
        message: 'Lead deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete lead',
        error: error.message
      });
    }
  },

  // Get lead statistics
  stats: async (req, res) => {
    try {
      const userId = req.admin.id;

      const { data: leads, error } = await supabase
        .from('leads')
        .select('rating, business_types')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      const totalLeads = leads.length;
      const avgRating = totalLeads > 0 
        ? leads.reduce((sum, lead) => sum + (lead.rating || 0), 0) / totalLeads 
        : 0;
      
      const result = { totalLeads, avgRating, topBusinessTypes: leads.map(l => l.business_types || []) };

      // Flatten and count business types
      const businessTypeCounts = {};
      result.topBusinessTypes.flat().forEach(type => {
        businessTypeCounts[type] = (businessTypeCounts[type] || 0) + 1;
      });

      const topTypes = Object.entries(businessTypeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }));

      res.json({
        success: true,
        data: {
          totalLeads: result.totalLeads,
          averageRating: result.avgRating ? result.avgRating.toFixed(1) : 0,
          topBusinessTypes: topTypes
        }
      });

    } catch (error) {
      console.error('Error fetching lead stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lead statistics',
        error: error.message
      });
    }
  }
};

module.exports = leadController;
