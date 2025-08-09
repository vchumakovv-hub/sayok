import React, { useEffect, useState } from 'react';
import { Button } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import io from 'socket.io-client';  // Socket.IO client for RN

// URL вашего NestJS WebSocket сервера
const SOCKET_SERVER_URL = 'ws://YOUR_SERVER_URL';

export default function TranslatorCall({ userLanguage }) {
  const [socket, setSocket] = useState(null);
  const [recording, setRecording] = useState(null);

  useEffect(() => {
    // Подключаемся к WebSocket (Socket.IO)
    const newSocket = io(SOCKET_SERVER_URL);
    // Отправляем на сервер информацию о языке пользователя
    newSocket.emit('register', { language: userLanguage });
    // Обработка получения переведенного текста от сервера
    newSocket.on('translation', async ({ text }) => {
      console.log('\u041f\u043e\u043b\u0443\u0447\u0435\u043d \u043f\u0435\u0440\u0435\u0432\u043e\u0434:', text);
      // Воспроизведение перев\u0451денног\u043e текста гол\u043eс\u043eм уст\u0440\u043eйс\u0442\u0432а
      Speech.speak(text, { language: userLanguage });
      // Также можно отображать текст перевода на экране, если н\u0443жн\u043e
    });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [userLanguage]);

  // Начать запись аудио и отправл\u044fть на сервер
  async function startRecording() {
    try {
      // Запрашив\u0430ем разрешение на испол\u044cзование микроф\u043eна
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert('\u041d\u0435\u043e\u0431\u0445\u043e\u0434\u0438\u043c \u0434\u043e\u0441\u0442\u0443\u043f \u043a \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d\u0443');
        return;
      }
      // Настраив\u0430\u0435м аудио режим
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      // Создаем экземпл\u044fр з\u0430п\u0438\u0441\u0438
      const recordingInstance = new Audio.Recording();
      await recordingInstance.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      // Обновл\u0435н\u0438е статуса з\u0430п\u0438\u0441\u0438 (\u043c\u043eж\u043d\u043e отп\u0440\u0430в\u043b\u044fт\u044c ч\u0430н\u043aи в р\u0435а\u043b\u044cном времен\u0438 п\u0440\u0438 обнов\u043b\u0435н\u0438и)
      recordingInstance.setOnRecordingStatusUpdate(status => {
        // Вар\u0438а\u043d\u0442: п\u0440\u0438 д\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043eм р\u0430зм\u0435\u0440\u0435 б\u0443\u0444\u0435\u0440\u0430 м\u043eж\u043d\u043e с\u0447\u0438\u0442\u044b\u0432\u0430\u0442\u044c и от\u043f\u0440\u0430\u0432\u043b\u044f\u0442\u044c ч\u0430с\u0442ь д\u0430н\u043d\u044b\u0445
      });
      await recordingInstance.startAsync();
      setRecording(recordingInstance);
    } catch (err) {
      console.error('\u041e\u0448\u0438\u0431\u043a\u0430 п\u0440\u0438 з\u0430\u043f\u0443\u0441\u043a\u0435 з\u0430п\u0438\u0441\u0438', err);
    }
  }

  // Остан\u043e\u0432\u0438т\u044c з\u0430п\u0438\u0441\u044c и отп\u0440\u0430в\u0438\u0442\u044c а\u0443\u0434\u0438\u043e н\u0430 серв\u0435\u0440
  async function stopRecording() {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();  // п\u0443т\u044c к з\u0430п\u0438\u0441\u0430\u043d\u043d\u043eм\u0443 ф\u0430й\u043b\u0443
      console.log('\u0410\u0443\u0434\u0438\u043e з\u0430\u043f\u0438\u0441\u0430\u043d\u043e в ф\u0430\u0439\u043b', uri);
      // Чи\u0442\u0430ем с\u043e\u0434\u0435р\u0436\u0438\u043c\u043eе ф\u0430\u0439\u043b\u0430 в base64
      const fileData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      // Отп\u0440\u0430\u0432\u043b\u044f\u0435м а\u0443\u0434\u0438\u043e-д\u0430н\u043d\u044b\u0435 н\u0430 с\u0435рв\u0435р ч\u0435\u0440е\u0437 WebSocket
      socket.emit('audio', { data: fileData });
      setRecording(null);
    } catch (err) {
      console.error('\u041e\u0448\u0438\u0431\u043a\u0430 о\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0438 з\u0430\u043f\u0438\u0441\u0438', err);
    }
  }

  return (
    <>
      <Button title={recording ? "\u041e\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u044c" : "\u0413\u043e\u0432\u043e\u0440\u0438\u0442\u044c"} onPress={recording ? stopRecording : startRecording} />
      {/* Дополн\u0438т\u0435\u043b\u044c\u043d\u043e м\u043eж\u043d\u043e п\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c п\u043e\u0441л\u0435\u0434\u043d\u0438\u0439 п\u0435\u0440\u0435\u0432\u0435\u0434\u0435\u043d\u043d\u044b\u0439 т\u0435\u043a\u0441\u0442 */}
    </>
  );
}
