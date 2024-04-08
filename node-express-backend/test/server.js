import {expect} from 'chai';
import request from 'request';
import mocha from 'mocha';

const baseUrl = 'http://localhost:8000/api';

describe('GET /api/movies route', () => {
    it('should return status code 200', async () => {
        // Make a GET request to the /api/movies route
        request(`${baseUrl}/movies`, (error, response, body) => {
            expect(response.statusCode).to.equals(200);
        });
    });
});
