import { WebSocketGateway, SubscribeMessage, WebSocketServer, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import { createReadStream } from 'fs';
import { OpenAIApi, Configuration } from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@WebSocketGateway()
export class CallGateway {
  @WebSocketServer()
  server: Server;

  private openai: OpenAIApi;
  private userLanguages = new Map<string, string>();

  constructor(@InjectRepository(Message) private messageRepo: Repository<Message>) {
    const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    this.openai = new OpenAIApi(config);
  }

  @SubscribeMessage('register')
  handleRegister(@ConnectedSocket() client: Socket, @MessageBody() data: { language: string }) {
    // Store the user's preferred language (e.g., 'ru' or 'en')
    this.userLanguages.set(client.id, data.language);
  }

  @SubscribeMessage('audio')
  async handleAudioMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { data: string }) {
    try {
      // Decode base64 audio and save to a temporary file
      const audioBuffer = Buffer.from(payload.data, 'base64');
      const tempFilePath = `./temp_audio_${client.id}.m4a`;
      await fs.promises.writeFile(tempFilePath, audioBuffer);

      // Transcribe audio using Whisper API
      const transcription = await this.openai.createTranscription(
        createReadStream(tempFilePath),
        'whisper-1'
      );
      const originalText: string = transcription.data.text;

      // Determine target language based on sender's language
      const userLang = this.userLanguages.get(client.id);
      const targetLang = userLang === 'ru' ? 'en' : 'ru';

      // Generate translation prompt
      const prompt = targetLang === 'en'
        ? `\u041f\u0435\u0440\u0435\u0432\u0435\u0434\u0438 \u043d\u0430 \u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u0438\u0439: ${originalText}`
        : `Translate to Russian: ${originalText}`;

      // Translate text using ChatGPT
      const completion = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });
      const translatedText: string = completion.data.choices[0].message.content;

      // Save message to database
      const messageRecord = this.messageRepo.create({
        dialogueId: 1,
        senderSocketId: client.id,
        originalText,
        translatedText,
        timestamp: new Date(),
      });
      await this.messageRepo.save(messageRecord);

      // Send translation to the other participant(s)
      client.broadcast.emit('translation', { text: translatedText });
    } catch (error) {
      console.error('Error processing audio message:', error);
    }
  }
}
