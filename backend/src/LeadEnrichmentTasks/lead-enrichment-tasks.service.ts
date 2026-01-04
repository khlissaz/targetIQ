'use strict';

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { LeadEnrichmentTask } from './entities/LeadEnrichmentTask.entity';
import { LeadBehaviour } from 'src/lead/lead-behaviour/lead-behaviour.entity';
import { User } from '../users/entities/user.entity';
import { StartLeadEnrichmentTaskResponseDto } from './dto/start-lead-enrichment-task-response.dto';
import leadEnrichmentTaskToGetStatusOfProcessingTaskResponseMapper from './dto/lead-enrichment-task-to-get-status-of-processing-task-response-mapper';
import { GetStatusOfProcessingTaskResponseDto } from './dto/get-status-of-processing-task-response.dto';
import nock from 'nock';
import { LeadProfile } from 'src/lead/lead-profile/lead-profile.entity';
import { Credit, CreditType } from 'src/credits/entities/credits.entity';
import { CreditsService } from 'src/credits/credits.service';

@Injectable()
export class LeadEnrichmentTasksService {
  constructor(
    @InjectRepository(LeadEnrichmentTask)
    private readonly leadEnrichmentTaskRepository: Repository<LeadEnrichmentTask>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private creditsService: CreditsService,
    @InjectRepository(LeadBehaviour)
    private readonly leadRepository: Repository<LeadBehaviour>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(): Promise<LeadEnrichmentTask[]> {
    return await this.leadEnrichmentTaskRepository.find();
  }

  // TODO : update the following create method pour obliger certains champs comme userId et leadId
  // et profileLink 
  async create(taskData: Partial<LeadEnrichmentTask>): Promise<LeadEnrichmentTask> {
    const task = this.leadEnrichmentTaskRepository.create(taskData);
    return await this.leadEnrichmentTaskRepository.save(task);
  }

  async checkIfUserHasEnoughCredits(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    // if ((user.enrichmentCredit || 0) <= 0) {
    const enrichmentCredit = await this.creditsService.getEnrichmentCredit(userId);
    if (enrichmentCredit.amount <= 0) {
      throw new HttpException(
        {
          taskId: null,
          status: 'error',
          step: 'step0',
          source: null,
          email: null,
          message: 'Insufficient enrichment credits',
          enrichmentRequestId: null,
        } as StartLeadEnrichmentTaskResponseDto,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async startLeadEnrichmentProcess(
  userId: string,
  leadId: string,
  ): Promise<StartLeadEnrichmentTaskResponseDto> {
    let creditDeducted = false;
    try {
      const useMock = this.configService.get<string>('NODE_ENV');
      console.log('nockOne');
      // if (useMock === 'development' ) {
      //   nock('https://app.fullenrich.com')
      //     .post('/api/v1/contact/enrich/bulk')
      //     .reply(200, { enrichment_id: 'mock-enrichment-id-123' });
      // }
      await this.checkIfUserHasEnoughCredits(userId);
      
      // TODO : vérifier plus tard si le lead existe dans la bdd locale

      // Vérifier si l'utilisateur existe
      const user = await this.userRepository.findOne({ where: { id: userId } });
    
      if (!user) {
        throw new HttpException(
          {
            taskId: null,
            status: 'error',
            step: 'step0',
            source: null,
            email: null,
            message: 'User not found',
            enrichmentRequestId: null,
          } as StartLeadEnrichmentTaskResponseDto,
          HttpStatus.NOT_FOUND,
        );
      }

      // Vérifier si le lead existe
      const LeadBehaviour: LeadBehaviour = await this.leadRepository.findOne({ where: { id: leadId } });
      if (!LeadBehaviour) {
        throw new HttpException(
          {
            taskId: null,
            status: 'error',
            step: 'step0',
            source: null,
            email: null,
            message: 'Lead not found',
            enrichmentRequestId: null,
          } as StartLeadEnrichmentTaskResponseDto,
          HttpStatus.NOT_FOUND,
        );
      }

      // TODO : changer l'adresse fullenrich en dur
      
      // Préparer la requête FullEnrich
      const fullEnrichUrl = 'https://app.fullenrich.com/api/v1/contact/enrich/bulk';
      const token = this.configService.get<string>('FULLENRICH_API_KEY');

      let enrichmentRequestId: string | null = null;
      try {
        const response = await firstValueFrom(
          this.httpService.post(
            fullEnrichUrl,
            {
              name: `Enrich Lead ${leadId} for User ${userId}`,
              datas: [
                {
                  firstname: LeadBehaviour.profile.firstname || '',
                  lastname: LeadBehaviour.profile.lastname || '',
                  company_name: LeadBehaviour.profile.company || '',
                  linkedin_url: LeadBehaviour.profile.profileLink || '',
                  enrich_fields: ['contact.emails'],
                  custom: { user_id: userId },
                },
              ],
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          ),
        );
        if (!response.data || !response.data.enrichment_id) {
          throw new Error('Invalid response from FullEnrich API');
        }
        
        enrichmentRequestId = response.data.enrichment_id;

      } catch (error) {
        if (error.response?.status === 400) {
          throw new HttpException(
            {
              taskId: null,
              status: 'error',
              step: 'step0',
              source: null,
              email: null,
              message: 'Enrichment in progress, try again later',
              enrichmentRequestId: null,
            } as StartLeadEnrichmentTaskResponseDto,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (error.response?.status === 401) {
          throw new HttpException(
            {
              taskId: null,
              status: 'error',
              step: 'step0',
              source: null,
              email: null,
              message: 'Authorization headers not set',
              enrichmentRequestId: null,
            } as StartLeadEnrichmentTaskResponseDto,
            HttpStatus.UNAUTHORIZED,
          );
        }
        if (error.response?.status === 404) {
          throw new HttpException(
            {
              taskId: null,
              status: 'error',
              step: 'step0',
              source: null,
              email: null,
              message: 'Enrichment ID not found',
              enrichmentRequestId: null,
            } as StartLeadEnrichmentTaskResponseDto,
            HttpStatus.NOT_FOUND,
          );
        }
        throw error;
      }
      
      // TODO : change "pending" by object value

      const task = await this.create({
        user: { id: userId },
        lead: { id: leadId },
        status: 'pending',
        step: 'step1',
        source: 'FullEnrich',
        email: null,
        enrichmentRequestId,
      } as Partial<LeadEnrichmentTask>);

      
      LeadBehaviour.status = 'pending';
      await this.leadRepository.save(LeadBehaviour);

      // Déduire le crédit après la création de la tâche
      // user.enrichmentCredit = (user.enrichmentCredit || 0) - 1;
      // await this.userRepository.save(user);
      const enrichmentCredit = await this.creditsService.getEnrichmentCredit(userId);
      enrichmentCredit.amount -= 1;
      await this.creditsService.setCredits(userId, CreditType.ENRICHMENT, enrichmentCredit.amount);
      creditDeducted = true;
      
      // TODO : if I remove a field here after the vsc not red underline pourtant il y a un typage controlé par typescript

      return {
        taskId: task.id,
        status: 'pending',
        step: 'step1',
        source: 'FullEnrich',
        email: null,
        message: 'The FullEnrich enrichment process started successfully',
        enrichmentRequestId,
      } as StartLeadEnrichmentTaskResponseDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Restaurer le crédit uniquement si décrémenté
      if (creditDeducted) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const enrichmentCredit = await this.creditsService.getEnrichmentCredit(userId);
       
        if (user && enrichmentCredit) {
          // user.enrichmentCredit += 1;
          // await this.userRepository.save(user);
          enrichmentCredit.amount += 1;
          await this.creditsService.setCredits(userId, CreditType.ENRICHMENT, enrichmentCredit.amount);
        }
      }
    
      throw new HttpException(
        {
          taskId: null,
          status: 'error',
          step: 'step0',
          source: null,
          email: null,
          message: "An error occurred during the FullEnrich enrichment process",
        } as StartLeadEnrichmentTaskResponseDto,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStatusOfProcessingTasks(userId: string): Promise<GetStatusOfProcessingTaskResponseDto[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException(`User with ID ${userId} not found`, HttpStatus.NOT_FOUND);
    }

    const useMock = this.configService.get<string>('NODE_ENV');
      // if (useMock === 'development' ) {
      //   console.log('nockTwo');
      //   nock('https://app.fullenrich.com')
      //     .get(/\/api\/v1\/contact\/enrich\/bulk\/.*/)
      //     .reply(200, {
      //       status: 'FINISHED',
      //       datas: [
      //         {
      //           contact: {
      //             most_probable_email: 'test@example.com',
      //             most_probable_email_status: 'DELIVERABLE',
      //             profile: {
      //               position: { company: { name: 'Mock Corp' }, title: 'Developer' },
      //               location: 'Mock City',
      //             },
      //           },
      //         },
      //       ],
      //     });
      // }
    
    const tasks: LeadEnrichmentTask[] = await this.leadEnrichmentTaskRepository.find({
      where: {
        user: { id: userId },
        status: 'pending',
      },
      relations: ['user', 'lead'],
    });

    const token = this.configService.get<string>('FULLENRICH_API_KEY');
    const updatedTasks = await Promise.all(
      tasks.map(async (task) => {
        const fullEnrichUrl = `https://app.fullenrich.com/api/v1/contact/enrich/bulk/${task.enrichmentRequestId}`;
        try {
          const response = await firstValueFrom(
            this.httpService.get(fullEnrichUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }),
          );

          if (!response.data || !response.data.status) {
            throw new Error('Invalid response from FullEnrich API');
          }

          const { status, datas } = response.data;
          const contact = datas[0]?.contact;
          const emailStatus = contact?.most_probable_email_status;
          
          // Recréditer pour statuts CANCELED, CREDITS_INSUFFICIENT, RATE_LIMIT, UNKNOWN
          if (['CANCELED', 'CREDITS_INSUFFICIENT', 'RATE_LIMIT', 'UNKNOWN'].includes(status)) {
            // user.enrichmentCredit += 1;
            const enrichmentCredit = await this.creditsService.getEnrichmentCredit(userId);
            if (enrichmentCredit) {
              enrichmentCredit.amount += 1;
              await this.creditsService.setCredits(userId, CreditType.ENRICHMENT, enrichmentCredit.amount);
            }
            await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
              await transactionalEntityManager.save(User, user);
              task.status = 'error';
              await transactionalEntityManager.save(LeadEnrichmentTask, task);
            });
            return task;
          }

          // Conserver pending pour CREATED ou IN_PROGRESS
          if (['CREATED', 'IN_PROGRESS'].includes(status)) {
            task.status = "pending";
            await this.leadEnrichmentTaskRepository.save(task);
            return task;
          }

          // Pour FINISHED, vérifier l'email
          if (status === 'FINISHED') {
            if (!contact?.most_probable_email || emailStatus === 'INVALID') {
              // user.enrichmentCredit += 1;
              const enrichmentCredit = await this.creditsService.getEnrichmentCredit(userId);
              if (enrichmentCredit) {
                enrichmentCredit.amount += 1;
                await this.creditsService.setCredits(userId, CreditType.ENRICHMENT, enrichmentCredit.amount);
              }
              await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
                await transactionalEntityManager.save(User, user);
                task.status = 'error';
                await transactionalEntityManager.update(LeadBehaviour, { id: task.lead.id }, { status: 'error' });
                await transactionalEntityManager.save(LeadEnrichmentTask, task);
              });
              return task;
            }

            if (['DELIVERABLE', 'HIGH_PROBABILITY', 'CATCH_ALL'].includes(emailStatus)) {
              await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
                task.status = 'success';
                task.email = contact.most_probable_email || task.email;
                task.company = contact.profile?.position?.company?.name || task.company;
                task.position = contact.profile?.position?.title || task.position;
                task.location = contact.profile?.location || task.location;

                if (contact.most_probable_email && task.lead) {
                  await transactionalEntityManager.update(LeadBehaviour, { id: task.lead.id }, { status: 'success' });
                  await transactionalEntityManager.update(LeadProfile, { id: task.lead.profile.id }, { email: contact.most_probable_email });
                }
                await transactionalEntityManager.save(LeadEnrichmentTask, task);
              });
              // Decrement enrichment credit for successful enrichment
              await this.creditsService.decrementEnrichmentCredit(userId, 1);
              return task;
            }
          }

          return task;
        } catch (error) {
          // Recréditer pour erreurs HTTP 400, 401, 404 (exclure 403)
          if (error.response?.status === 400 || error.response?.status === 401 || error.response?.status === 404) {
            // user.enrichmentCredit += 1;
            const enrichmentCredit = await this.creditsService.getEnrichmentCredit(userId);
            if (enrichmentCredit) {
              enrichmentCredit.amount += 1;
              await this.creditsService.setCredits(userId, CreditType.ENRICHMENT, enrichmentCredit.amount);
            }
            await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
              await transactionalEntityManager.save(User, user);
              task.status = 'error';
              await transactionalEntityManager.save(LeadEnrichmentTask, task);
            });
          } else {
            // Conserver pending pour erreurs réseau ou autres (ex. 403, 500)
            console.error(`Error fetching status for task ${task.id} with enrichmentRequestId ${task.enrichmentRequestId}:`, error);
          }
          return task;
        }
      }),
    );
    return leadEnrichmentTaskToGetStatusOfProcessingTaskResponseMapper(updatedTasks);
  }
}