import Iyzipay from "iyzipay";

export function iyzicoClient() {
  const apiKey = process.env.IYZICO_API_KEY!;
  const secretKey = process.env.IYZICO_SECRET!;
  const uri = process.env.IYZICO_BASE_URL || "https://api.iyzipay.com";
  if (!apiKey || !secretKey) throw new Error("IYZICO env eksik");
  return new (Iyzipay as any)({ apiKey, secretKey, uri });
}

// Iyzipay SDK'sı callback tarzı; Promise sarmalayıcısı:
export function iyzicoCall<T>(fn: (cb: (err: any, res: T) => void) => void) {
  return new Promise<T>((resolve, reject) => {
    fn((err, res) => (err ? reject(err) : resolve(res)));
  });
}
