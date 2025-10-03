import axiosInstance from '../utils/axios'
import { API_ENDPOINTS } from '../config/api.config'

/**
 * Ad Service
 * Handles all ad-related API calls using axios
 */

// Create Campaign
export const createAd = async (formData) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.CAMPAIGNS.CREATE, formData)
    return response.data
  } catch (error) {
    console.error('Error creating ad:', error)
    throw error
  }
}

// Get Ads Status
export const getAdsStatus = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.ADS.STATUS)
    return response.data
  } catch (error) {
    console.error('Error fetching ads status:', error)
    throw error
  }
}

// Update Campaign
export const updateCampaign = async (id, data) => {
  try {
    const response = await axiosInstance.put(API_ENDPOINTS.CAMPAIGNS.UPDATE(id), data)
    return response.data
  } catch (error) {
    console.error('Error updating campaign:', error)
    throw error
  }
}

// Update AdSet
export const updateAdSet = async (id, data) => {
  try {
    const response = await axiosInstance.put(API_ENDPOINTS.ADSETS.UPDATE(id), data)
    return response.data
  } catch (error) {
    console.error('Error updating ad set:', error)
    throw error
  }
}

// Update Ad
export const updateAd = async (id, data) => {
  try {
    const response = await axiosInstance.put(API_ENDPOINTS.ADS.UPDATE(id), data)
    return response.data
  } catch (error) {
    console.error('Error updating ad:', error)
    throw error
  }
}

// Delete Campaign
export const deleteCampaign = async (id) => {
  try {
    const response = await axiosInstance.delete(API_ENDPOINTS.CAMPAIGNS.DELETE(id))
    return response.data
  } catch (error) {
    console.error('Error deleting campaign:', error)
    throw error
  }
}

// Delete AdSet
export const deleteAdSet = async (id) => {
  try {
    const response = await axiosInstance.delete(API_ENDPOINTS.ADSETS.DELETE(id))
    return response.data
  } catch (error) {
    console.error('Error deleting ad set:', error)
    throw error
  }
}

// Delete Ad
export const deleteAd = async (id) => {
  try {
    const response = await axiosInstance.delete(API_ENDPOINTS.ADS.DELETE(id))
    return response.data
  } catch (error) {
    console.error('Error deleting ad:', error)
    throw error
  }
}