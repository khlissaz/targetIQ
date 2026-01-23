import apiClient from "./api";

export const logActivity = async (action: string, resource: string, details: string = '', metadata: Record<string, any> = {}) => {
    try {
        await apiClient.post('/user-activities', {
            action,
            resource,
            details,
            metadata
          });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};
