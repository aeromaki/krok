import path from 'path';
import express from 'express';
import http from 'http';
import OBSWebSocket from 'obs-websocket-js';
import { app } from 'electron'
import ejs from 'ejs'

const isDev = !app.isPackaged;


const obs = new OBSWebSocket();
const PORT = 7777;

const resultCache = { value: null };

export default function createServer() {
  const app = express();
  app.use(express.json());

  app.engine('ejs', ejs.renderFile);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, isDev ? '../../src/main/overlay' : 'overlay'));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Local-Token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.post("/connect", async (req, res) => {
    try {
      const { address, password } = req.body;
      console.log('/connect', address, password);
      await obs.connect(`ws://${address}`, password || "");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/overlay/upsertOrRefresh", async (req, res) => {
    try {
      console.log('/overlay/upsertOrRefresh');
      const { sourceName, width = 450, height = 930, result } = req.body;
      resultCache.value = result;

      // 현재 소스 목록 확인
      const sources = await obs.call("GetInputList");
      const exists = sources.inputs.find((s) => s.inputName === sourceName);

      if (!exists) {
        // 없으면 생성
        await obs.call("CreateInput", {
          sceneName: "Scene",
          inputName: sourceName,
          inputKind: "browser_source",
          inputSettings: {
            url: `http://127.0.0.1:${PORT}/overlay`,
            width,
            height,
          },
        });
        return res.json({ success: true, created: true, refreshed: false });
      }

      // 있으면 refresh
      await obs.call("PressInputPropertiesButton", {
        inputName: sourceName,
        propertyName: "refreshnocache",
      });

      res.json({ success: true, created: false, refreshed: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/overlay/visible", async (req, res) => {
    try {
      console.log('/overlay/visible');
      const { sourceName, visible } = req.body;

      await obs.call("SetSceneItemEnabled", {
        sceneName: "Scene", // 기본 장면 이름
        sceneItemId: await getSceneItemId(sourceName),
        sceneItemEnabled: visible,
      });

      res.json({ success: true, visible });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/overlay', (_req, res) => {
    console.log('/overlay');
    res.render('overlay', resultCache.value ?? {
      pitch: 0,
      rhythm: 0,
      emotion: 0,
      total: 0,
      content: ''
    });
  });

  const server = http.createServer(app);

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Local overlay server: http://127.0.0.1:${PORT}/overlay`);
  });

  return { server };
}

async function getSceneItemId(sourceName: string): Promise<number> {
  const { sceneItems } = await obs.call("GetSceneItemList", {
    sceneName: "Scene",
  });
  const item = sceneItems.find((i) => i.sourceName === sourceName);
  if (!item) throw new Error(`Scene item ${sourceName} not found`);
  // @ts-expect-error: _
  return item.sceneItemId;
}