import { config } from 'dotenv';
import { resolve } from 'path';
import chai from 'chai';
import sinonChai from 'sinon-chai';

config({ path: resolve(__dirname, '../.env.test') });

chai.use(sinonChai);
