# Product Manager — Vue 3 + Express CRUD

ตัวอย่างระบบ CRUD ที่ประกอบด้วย client (Vue 3) และ API (Express) โดยเลือกใช้ library
ชุดเดียวกับที่ทีมส่วนใหญ่ใช้จริงในโปรเจกต์ production ไม่ใช่แค่ `fetch` + `v-model` เปล่า ๆ

## Stack (เทียบกับฝั่ง React)

| หน้าที่ | ฝั่ง React | ที่ใช้ในโปรเจกต์นี้ |
| --- | --- | --- |
| Server state / caching | TanStack Query | **@tanstack/vue-query** |
| Form + validation | react-hook-form + zod | **vee-validate + @vee-validate/zod + zod** |
| HTTP client | axios | **axios** (+ interceptor แปลง error) |
| Utilities | lodash | **lodash-es** (`debounce`, `omitBy`, `isEqual`) |
| Client state | Zustand / Redux | **Pinia** (ใช้แค่ toast — ที่เหลือเป็น server state) |
| Routing | react-router | **vue-router** |
| Build / types | Vite + TS | **Vite + TypeScript + vue-tsc** |
| Backend | Express | **Express 5 + zod** (in-memory store) |

## รันโปรเจกต์

```bash
npm install          # ติดตั้งทั้ง workspace (client + server)
npm run dev          # ยิงพร้อมกัน: API :3001, client :5173
```

เปิด http://localhost:5173 — Vite proxy `/api` ไปที่ `http://localhost:3001` ให้แล้ว ไม่ต้องตั้ง CORS เอง

คำสั่งอื่น ๆ

```bash
npm run dev:server   # API อย่างเดียว (node --watch)
npm run dev:client   # client อย่างเดียว
npm run typecheck    # vue-tsc --noEmit
npm run build        # build client ไป client/dist
```

ตัวแปรที่ปรับได้

| ตัวแปร | ค่า default | ใช้ทำอะไร |
| --- | --- | --- |
| `PORT` | `3001` | port ของ API |
| `FAKE_LATENCY` | `250` | หน่วงเวลาเทียม (ms) เพื่อให้เห็น loading / optimistic update ชัด ๆ ตั้ง `0` เพื่อปิด |
| `VITE_API_BASE_URL` | `/api` | base url ฝั่ง client (ตอน deploy แยก domain ค่อยตั้ง) |

## API

| Method | Path | หมายเหตุ |
| --- | --- | --- |
| `GET` | `/api/products` | query: `search`, `category`, `status`, `sort`, `order`, `page`, `pageSize` → `{ data, meta }` |
| `GET` | `/api/products/:id` | `{ data }` หรือ 404 |
| `POST` | `/api/products` | 201 / 422 (validation) / 409 (SKU ซ้ำ) |
| `PATCH` | `/api/products/:id` | partial update |
| `DELETE` | `/api/products/:id` | 204 |
| `GET` | `/api/meta` | ค่า enum ของ category / status |
| `GET` | `/api/health` | health check |

error ทุกตัวออกหน้าตาเดียวกันเสมอ ฝั่ง client จึง parse ที่เดียวจบ:

```json
{ "message": "Validation failed", "code": "validation_error", "errors": { "sku": ["..."] } }
```

## โครงสร้าง

```
server/src
├── index.js              # app + error handler กลาง
├── db.js                 # in-memory store (เปลี่ยนเป็น Prisma/Knex ได้โดยไม่แตะ route)
├── schemas.js            # zod schema ของ body และ query
├── routes/products.js    # CRUD endpoints
└── lib/                  # validate middleware, HttpError, asyncHandler

client/src
├── api/http.ts           # axios instance + ApiError (normalize error ทั้งแอป)
├── api/products.ts       # zod schema + type + ฟังก์ชันยิง API
├── queries/products.ts   # query key factory + useQuery/useMutation
├── composables/          # useProductFilters (ฟิลเตอร์ผูกกับ URL + debounce)
├── stores/toast.ts       # Pinia (client state ล้วน ๆ)
├── components/           # ProductForm, ProductTable, ConfirmDialog, ...
└── views/                # List / Create / Edit / NotFound
```

## จุดที่ตั้งใจให้ดูเป็นตัวอย่าง

- **Query key factory** (`queries/products.ts`) — `productKeys.lists()` ทำให้ invalidate ทุกหน้า/ทุกฟิลเตอร์พร้อมกันได้ ไม่ต้องไล่จำ key เอง
- **Optimistic delete** — `onMutate` ตัดแถวออกจาก cache ทันที, `onError` rollback จาก snapshot, `onSettled` invalidate เพื่อ sync กับ server เสมอ
- **`keepPreviousData`** — เปลี่ยนหน้า/เรียงใหม่แล้วตารางไม่กระพริบ มีแค่ตัว dim ระหว่าง refetch
- **schema เดียวใช้สองหน้าที่** — `productFormSchema` ทั้ง validate ฟอร์มและ derive type ของ payload (`z.output`) จึงไม่มีทางที่ type กับ validation จะหลุดจากกัน
- **server error กลับเข้าฟิลด์** — SKU ซ้ำ (409) ถูก map เข้า `setErrors()` ของ vee-validate ขึ้นใต้ช่อง SKU ตรง ๆ
- **URL คือ source of truth ของฟิลเตอร์** — refresh / กด back / แชร์ลิงก์ แล้วได้ผลลัพธ์เดิม ช่องค้นหา debounce ด้วย lodash 350ms
- **unsaved changes guard** — `onBeforeRouteLeave` เตือนเมื่อฟอร์ม dirty แล้วกดออกจากหน้า
- **Vue Query Devtools** — เปิดเฉพาะตอน dev (มุมขวาล่าง) prod build tree-shake ทิ้ง

ข้อมูลเก็บใน memory ล้วน ๆ (`server/src/db.js`) รีสตาร์ท server เมื่อไหร่ก็กลับไปเป็น seed 27 รายการเหมือนเดิม
