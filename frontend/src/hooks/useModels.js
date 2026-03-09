import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useApp } from '../AppContext';

const useModels = () => {
    const { t } = useApp();
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchModels = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3001/api/models');
            setModels(res.data);
            setError(null);
        } catch (e) {
            console.error("Failed to fetch models", e);
            setError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    const saveModel = async (modelConfig) => {
        try {
            if (modelConfig.id) {
                await axios.put(`http://localhost:3001/api/models/${modelConfig.id}`, modelConfig);
            } else {
                await axios.post('http://localhost:3001/api/models', modelConfig);
            }
            await fetchModels();
            return { success: true };
        } catch (e) {
            console.error(e);
            return { success: false, error: e };
        }
    };

    const removeModel = async (id) => {
        try {
            await axios.delete(`http://localhost:3001/api/models/${id}`);
            await fetchModels();
            return { success: true };
        } catch (e) {
            console.error(e);
            return { success: false, error: e };
        }
    };

    return {
        models,
        loading,
        error,
        fetchModels,
        saveModel,
        removeModel
    };
};

export default useModels;
