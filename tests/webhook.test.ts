// Conajra Solutions © 2026
// Author: Marwan

import request from 'supertest';
import express from 'express';
import { mediator } from '../src/modules/mediator';
import { BookAppointmentParams, CheckAvailabilityParams } from '../src/types/vapi';

// Mock the mediator for testing
jest.mock('../src/modules/mediator');
const mockMediator = mediator as jest.MockedClass<typeof mediator>;

describe('VAPI Webhook Integration', () => {
    let app: express.Application;
    let mockMediatorInstance: jest.Mocked<mediator>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create mock mediator instance
        mockMediatorInstance = {
            handle_webhook: jest.fn(),
            connect: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn().mockResolvedValue(undefined)
        } as any;

        mockMediator.mockImplementation(() => mockMediatorInstance);

        // Create test app
        app = express();
        app.use(express.json());

        // Simple webhook endpoint for testing (without verification for now)
        app.post('/vapi/webhook', async (req, res) => {
            try {
                const result = await mockMediatorInstance.handle_webhook(req.body);
                res.json(result);
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });
    });

    describe('POST /vapi/webhook', () => {
        it('should handle book_appointment function call', async () => {
            const bookingParams: BookAppointmentParams = {
                tenant_id: 'test-tenant',
                date: '2026-01-20',
                time: '10:00',
                customer_name: 'John Doe',
                customer_phone: '+1234567890',
                duration_minutes: 60
            };

            const expectedResult = {
                success: true,
                booking_id: 'booking_123',
                message: 'Appointment booked successfully'
            };

            mockMediatorInstance.handle_webhook.mockResolvedValue(expectedResult);

            const response = await request(app)
                .post('/vapi/webhook')
                .send({
                    function_name: 'book_appointment',
                    parameters: bookingParams
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(expectedResult);
            expect(mockMediatorInstance.handle_webhook).toHaveBeenCalledWith({
                function_name: 'book_appointment',
                parameters: bookingParams
            });
        });

        it('should handle check_availability function call', async () => {
            const availabilityParams: CheckAvailabilityParams = {
                tenant_id: 'test-tenant',
                date: '2026-01-20'
            };

            const expectedResult = [
                { date: '2026-01-20', time: '09:00', available: true, duration_minutes: 60 },
                { date: '2026-01-20', time: '10:00', available: true, duration_minutes: 60 }
            ];

            mockMediatorInstance.handle_webhook.mockResolvedValue(expectedResult);

            const response = await request(app)
                .post('/vapi/webhook')
                .send({
                    function_name: 'check_availability',
                    parameters: availabilityParams
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(expectedResult);
            expect(mockMediatorInstance.handle_webhook).toHaveBeenCalledWith({
                function_name: 'check_availability',
                parameters: availabilityParams
            });
        });

        it('should handle errors gracefully', async () => {
            mockMediatorInstance.handle_webhook.mockRejectedValue(new Error('Test error'));

            const response = await request(app)
                .post('/vapi/webhook')
                .send({
                    function_name: 'book_appointment',
                    parameters: { tenant_id: 'test' }
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Test error' });
        });

        it('should handle unknown function names', async () => {
            mockMediatorInstance.handle_webhook.mockRejectedValue(new Error('Unknown function name: unknown_function'));

            const response = await request(app)
                .post('/vapi/webhook')
                .send({
                    function_name: 'unknown_function',
                    parameters: {}
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Unknown function name: unknown_function' });
        });
    });
});