const API_URL = 'http://localhost:3001/api';

// Create
export const createAd = async (formData) => {
    try {
        const response = await fetch(`${API_URL}/create-campaign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create ad');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating ad:', error);
        throw error;
    }
};

// Read
export const getAdsStatus = async () => {
    try {
        const response = await fetch(`${API_URL}/status`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch ads status');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching ads status:', error);
        throw error;
    }
};

// Update
export const updateCampaign = async (id, data) => {
    try {
        const response = await fetch(`${API_URL}/campaigns/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update campaign');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating campaign:', error);
        throw error;
    }
};

export const updateAdSet = async (id, data) => {
    try {
        const response = await fetch(`${API_URL}/adsets/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update ad set');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating ad set:', error);
        throw error;
    }
};

export const updateAd = async (id, data) => {
    try {
        const response = await fetch(`${API_URL}/ads/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update ad');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating ad:', error);
        throw error;
    }
};

// Delete
export const deleteCampaign = async (id) => {
    try {
        const response = await fetch(`${API_URL}/campaigns/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete campaign');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting campaign:', error);
        throw error;
    }
};

export const deleteAdSet = async (id) => {
    try {
        const response = await fetch(`${API_URL}/adsets/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete ad set');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting ad set:', error);
        throw error;
    }
};

export const deleteAd = async (id) => {
    try {
        const response = await fetch(`${API_URL}/ads/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete ad');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting ad:', error);
        throw error;
    }
};