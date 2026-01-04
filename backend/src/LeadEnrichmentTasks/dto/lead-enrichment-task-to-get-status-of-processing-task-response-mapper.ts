import { LeadEnrichmentTask } from "../entities/LeadEnrichmentTask.entity";
import { GetStatusOfProcessingTaskResponseDto } from "./get-status-of-processing-task-response.dto";

const leadEnrichmentTaskToGetStatusOfProcessingTaskResponseMapper = (
    tasks: LeadEnrichmentTask[]
): GetStatusOfProcessingTaskResponseDto[] => {
    return tasks.map(task => {
        const response = new GetStatusOfProcessingTaskResponseDto();
        response.leadId = task.lead.id;
        response.status = task.status;
        response.email = task.email || null;
        return response;
    });
}

export default leadEnrichmentTaskToGetStatusOfProcessingTaskResponseMapper;

