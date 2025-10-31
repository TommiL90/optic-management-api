import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Configurar el servidor Fastify para Vercel
    await app.ready();
    
    // Convertir la request de Vercel a formato Fastify
    const fastifyRequest = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
    };

    // Procesar la request con Fastify
    const response = await app.inject(fastifyRequest);
    
    // Configurar headers de respuesta
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value as string);
    });
    
    // Enviar respuesta
    res.status(response.statusCode).send(response.payload);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
