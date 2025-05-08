const { Kafka } = require('kafkajs');
const MarketData = require('../models/marketData.model');

const kafka = new Kafka({
  clientId: 'quantfolio',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:29092').split(','),
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'quantfolio-group' });

// Topics
const TOPICS = {
  MARKET_DATA: 'market-data',
  TRADE_SIGNALS: 'trade-signals',
  PORTFOLIO_UPDATES: 'portfolio-updates',
};

// Initialize Kafka
const initializeKafka = async () => {
  try {
    await producer.connect();
    await consumer.connect();

    // Subscribe to topics
    await consumer.subscribe({ topic: TOPICS.MARKET_DATA, fromBeginning: true });
    await consumer.subscribe({ topic: TOPICS.TRADE_SIGNALS, fromBeginning: true });
    await consumer.subscribe({ topic: TOPICS.PORTFOLIO_UPDATES, fromBeginning: true });

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = JSON.parse(message.value.toString());
        
        switch (topic) {
          case TOPICS.MARKET_DATA:
            await handleMarketData(value);
            break;
          case TOPICS.TRADE_SIGNALS:
            await handleTradeSignals(value);
            break;
          case TOPICS.PORTFOLIO_UPDATES:
            await handlePortfolioUpdates(value);
            break;
        }
      },
    });

    console.log('Kafka initialized successfully');
  } catch (error) {
    console.error('Error initializing Kafka:', error);
    throw error;
  }
};

// Handle market data updates
const handleMarketData = async (data) => {
  try {
    const { symbol, price, timestamp } = data;
    
    // Update market data in MongoDB
    await MarketData.findOneAndUpdate(
      { symbol },
      {
        $push: {
          'data.prices': {
            price,
            timestamp: new Date(timestamp),
          },
        },
      },
      { upsert: true }
    );

    // Emit to connected clients via WebSocket
    // TODO: Implement WebSocket emission
  } catch (error) {
    console.error('Error handling market data:', error);
  }
};

// Handle trade signals
const handleTradeSignals = async (signal) => {
  try {
    const { symbol, type, price, quantity, portfolioId } = signal;
    
    // Create trade in database
    // TODO: Implement trade creation logic
  } catch (error) {
    console.error('Error handling trade signal:', error);
  }
};

// Handle portfolio updates
const handlePortfolioUpdates = async (update) => {
  try {
    const { portfolioId, type, data } = update;
    
    // Update portfolio in database
    // TODO: Implement portfolio update logic
  } catch (error) {
    console.error('Error handling portfolio update:', error);
  }
};

// Send message to Kafka
const sendMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
  } catch (error) {
    console.error('Error sending message to Kafka:', error);
    throw error;
  }
};

// Cleanup
const cleanup = async () => {
  try {
    await producer.disconnect();
    await consumer.disconnect();
  } catch (error) {
    console.error('Error cleaning up Kafka:', error);
  }
};

module.exports = {
  initializeKafka,
  sendMessage,
  cleanup,
  TOPICS,
}; 