import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/api/axios.js';

export const useMyPackage = () => {
    const [myPkg, setMyPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                const response = await axiosInstance.get('/api/user-package/my-package');
                if (response.data && response.data.success) {
                    setMyPkg(response.data.data);
                }
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPackage();
    }, []);

    const hasFeature = (featureKey) => {
        return myPkg?.package?.features?.includes(featureKey) || false;
    };

    return { myPkg, loading, error, hasFeature };
};
