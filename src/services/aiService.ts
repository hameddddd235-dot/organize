// src/services/aiService.ts
import { isValidExtraction, normalizeExtraction } from '../utils/extraction';
export { isValidExtraction } from '../utils/extraction';
import { Zone, ExtractedWorkOrder } from '../types';

export interface AIAnalysisResult {
  success: boolean;
  data?: ExtractedWorkOrder;
  error?: string;
  canFallbackToLocal: boolean;
  analyzerMode: 'REAL_AI' | 'LOCAL_RULES' | 'BROKEN';
}

/**
 * Service to manage AI document extraction.
 * Ensures security: API keys are NEVER embedded in client frontend code.
 * Honestly reports connection status and enforces fallback to deterministic local rules.
 */
declare const __AI_BACKEND_URL__: string;

export class AIService {
  private connected = false;
  private backendUrl: string | null;

  constructor(url = typeof __AI_BACKEND_URL__ !== 'undefined' ? __AI_BACKEND_URL__ : '') {
    this.backendUrl = url.trim() || null;
  }

  public async checkBackend(): Promise<string> {
    if (!this.backendUrl) return 'عنوان خادم التحليل غير مهيأ';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(this.backendUrl.replace(/\/analyze$/, '/health'), { signal: controller.signal });
      if (!response.ok) throw new Error();
      const status = await response.json();
      if (status.provider !== 'gemini' || typeof status.configured !== 'boolean') throw new Error();
      return status.configured ? 'خادم Gemini جاهز والمفتاح مضبوط. صلاحية المفتاح تُتحقق عند أول تحليل.' : 'الخادم يعمل؛ أضف GEMINI_API_KEY في إعداداته لتفعيل Gemini.';
    } catch { return 'تعذر الوصول إلى خادم التحليل. تحقق من تشغيله وإعداد عنوانه.'; }
    finally { clearTimeout(timer); }
  }

  public getStatus() {
    return {
      mode: this.connected ? 'REAL_AI' as const : 'LOCAL_RULES' as const,
      isBackendConfigured: Boolean(this.backendUrl),
      isBackendConnected: this.connected,
      messageAr: this.connected ? 'نجح آخر اتصال بخادم التحليل' : this.backendUrl
        ? 'تم إعداد عنوان الخادم؛ لم يتم التحقق من الاتصال بعد'
        : 'المحلل المحلي متاح. لم يتم إعداد خادم ذكاء اصطناعي.',
    };
  }

  /**
   * Attempts extraction via AI backend if configured.
   * If no backend is configured or the call fails, returns an honest explicit error
   * without fabricating mock data as real AI.
   */
  public async extractWorkOrder(rawText: string, zones: Zone[]): Promise<AIAnalysisResult> {
    if (!this.backendUrl) {
      return {
        success: false,
        error: 'تعذر الاتصال بمزود الذكاء الاصطناعي: الخادم الخلفي غير مهيأ. شغّل خدمة التحليل واضبط عنوانها؛ مفاتيح Gemini تحفظ في الخادم فقط.',
        canFallbackToLocal: true,
        analyzerMode: 'LOCAL_RULES',
      };
    }

    this.connected = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);
    try {

      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          zones: zones.map(z => ({ id: z.id, name_ar: z.name_ar, aliases: z.aliases })),
        }),
        signal: controller.signal,
      });


      if (!response.ok) {
        return {
          success: false,
          // Vite's proxy answers 500 when the API on port 8787 is not running.
          error: response.status === 500 ? 'تعذر الوصول إلى خادم التحليل. شغّل الموقع بالأمر npm run dev ثم أعد المحاولة، أو اختر التحليل المحلي.' : response.status === 503 ? 'خدمة AI غير مهيأة بعد. أكمل إعدادات الخادم أو اختر التحليل المحلي.' : response.status === 429 ? 'طلبات التحليل كثيرة حالياً؛ أعد المحاولة بعد قليل.' : response.status === 504 ? 'استغرق التحليل وقتاً أطول من المسموح. أعد المحاولة.' : `تعذر إكمال التحليل (رمز ${response.status}). يمكنك إعادة المحاولة أو اختيار التحليل المحلي.`,
          canFallbackToLocal: true,
          analyzerMode: 'BROKEN',
        };
      }

      const json: unknown = await response.json();
      if (!isValidExtraction(json, zones)) throw new Error('استجابة الخادم لا تطابق حقول أمر العمل المطلوبة');
      this.connected = true;
      return {
        success: true,
        data: {
          ...normalizeExtraction(json, zones, rawText),
          extraction_source: 'real_ai',
        },
        canFallbackToLocal: false,
        analyzerMode: 'REAL_AI',
      };
    } catch (e: any) {
      return {
        success: false,
        error: `خطأ في الاتصال بالذكاء الاصطناعي: ${e?.message || 'انتهت مهلة الطلب'}`,
        canFallbackToLocal: true,
        analyzerMode: 'BROKEN',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const aiService = new AIService();
