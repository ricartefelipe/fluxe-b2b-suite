import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { RuntimeConfigService } from '@saas-suite/shared/config';

interface AiResponse {
  engine: string;
  content: string;
  context: Record<string, unknown>;
}

interface AiStatus {
  engine: string;
  provider: string;
  model: string;
  capabilities: string[];
}

interface Insight {
  severity: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-ai-page',
  standalone: true,
  imports: [
    FormsModule, UpperCasePipe, MatButtonModule, MatCardModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule,
    MatChipsModule, MatDividerModule,
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>
            <mat-icon class="title-icon">smart_toy</mat-icon>
            Assistente IA
          </h1>
          <p class="subtitle">Análise inteligente de governança, auditoria e segurança</p>
        </div>
        <div class="engine-badge" [class.llm]="status()?.engine === 'llm'">
          <mat-icon>{{ status()?.engine === 'llm' ? 'psychology' : 'rule' }}</mat-icon>
          {{ status()?.engine === 'llm' ? 'LLM: ' + status()?.model : 'Rule Engine' }}
        </div>
      </div>
    </div>

    <div class="ai-grid">
      <!-- Chat -->
      <mat-card class="chat-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>chat</mat-icon>
          <mat-card-title>Chat com IA</mat-card-title>
          <mat-card-subtitle>Pergunte sobre governança, auditoria e segurança</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="chat-messages">
            @for (msg of chatHistory(); track $index) {
              <div class="chat-msg" [class.user]="msg.role === 'user'" [class.ai]="msg.role === 'ai'">
                <mat-icon>{{ msg.role === 'user' ? 'person' : 'smart_toy' }}</mat-icon>
                <div class="msg-content" [innerHTML]="msg.text"></div>
              </div>
            }
            @if (chatLoading()) {
              <div class="chat-msg ai">
                <mat-icon>smart_toy</mat-icon>
                <mat-spinner diameter="20" />
              </div>
            }
          </div>
          <div class="chat-input">
            <mat-form-field appearance="outline" class="full-width">
              <input matInput
                [(ngModel)]="chatMessage"
                placeholder="Ex: Quais anomalias foram detectadas hoje?"
                (keyup.enter)="sendChat()" />
            </mat-form-field>
            <button mat-fab color="primary" (click)="sendChat()" [disabled]="chatLoading() || !chatMessage">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Actions -->
      <div class="actions-column">
        <mat-card class="action-card" (click)="analyzeAudit()">
          <mat-icon class="action-icon" style="color: #e65100">security</mat-icon>
          <h3>Analisar Auditoria</h3>
          <p>Análise de segurança dos últimos logs de auditoria</p>
          @if (auditLoading()) { <mat-spinner diameter="24" /> }
        </mat-card>

        <mat-card class="action-card" (click)="getRecommendations()">
          <mat-icon class="action-icon" style="color: #1565c0">lightbulb</mat-icon>
          <h3>Recomendações</h3>
          <p>Sugestões de governança baseadas no estado atual</p>
          @if (recsLoading()) { <mat-spinner diameter="24" /> }
        </mat-card>

        <mat-card class="action-card" (click)="getInsights()">
          <mat-icon class="action-icon" style="color: #2e7d32">insights</mat-icon>
          <h3>Insights</h3>
          <p>Indicadores de saúde e oportunidades do sistema</p>
          @if (insightsLoading()) { <mat-spinner diameter="24" /> }
        </mat-card>
      </div>
    </div>

    <!-- Results -->
    @if (analysisResult()) {
      <mat-card class="result-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>{{ resultIcon() }}</mat-icon>
          <mat-card-title>{{ resultTitle() }}</mat-card-title>
          <mat-card-subtitle>Motor: {{ analysisResult()?.engine }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="result-content" [innerHTML]="analysisResult()?.content"></div>
        </mat-card-content>
      </mat-card>
    }

    @if (insights().length > 0) {
      <div class="insights-grid">
        @for (insight of insights(); track insight.title) {
          <mat-card class="insight-card" [class]="'severity-' + insight.severity">
            <div class="insight-header">
              <mat-icon>{{ severityIcon(insight.severity) }}</mat-icon>
              <span class="severity-badge">{{ insight.severity | uppercase }}</span>
            </div>
            <h3>{{ insight.title }}</h3>
            <p>{{ insight.description }}</p>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; padding: 24px; }

    .page-header { margin-bottom: 24px; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; }
    h1 { font-size: 28px; font-weight: 700; color: #1a2332; margin: 0 0 4px; display: flex; align-items: center; gap: 10px; }
    .title-icon { font-size: 32px; width: 32px; height: 32px; color: #1565c0; }
    .subtitle { color: #64748b; margin: 0; font-size: 14px; }

    .engine-badge {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; border-radius: 20px;
      background: #f1f5f9; color: #475569;
      font-size: 13px; font-weight: 600;
    }
    .engine-badge.llm { background: #eff6ff; color: #1565c0; }
    .engine-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .ai-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; margin-bottom: 24px; }

    .chat-card { height: 480px; display: flex; flex-direction: column; }
    .chat-card mat-card-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column; gap: 12px; }
    .chat-msg { display: flex; gap: 10px; align-items: flex-start; }
    .chat-msg.user { flex-direction: row-reverse; }
    .chat-msg.user .msg-content { background: #1565c0; color: #fff; border-radius: 16px 16px 4px 16px; }
    .chat-msg.ai .msg-content { background: #f1f5f9; border-radius: 16px 16px 16px 4px; }
    .msg-content { padding: 10px 16px; max-width: 85%; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
    .chat-msg mat-icon { flex-shrink: 0; margin-top: 4px; font-size: 20px; width: 20px; height: 20px; color: #64748b; }

    .chat-input { display: flex; gap: 12px; align-items: center; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    .full-width { flex: 1; }

    .actions-column { display: flex; flex-direction: column; gap: 16px; }
    .action-card {
      cursor: pointer; padding: 20px; text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .action-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
    .action-icon { font-size: 36px; width: 36px; height: 36px; margin-bottom: 8px; }
    .action-card h3 { font-size: 15px; font-weight: 600; margin: 0 0 6px; color: #1e293b; }
    .action-card p { font-size: 12px; color: #64748b; margin: 0; }

    .result-card { margin-bottom: 24px; }
    .result-content { white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #334155; }

    .insights-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .insight-card { padding: 20px; }
    .insight-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .severity-badge { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; }
    .insight-card h3 { font-size: 15px; font-weight: 600; margin: 0 0 6px; color: #1e293b; }
    .insight-card p { font-size: 13px; color: #64748b; margin: 0; line-height: 1.5; }

    .severity-critical { border-left: 4px solid #dc2626; }
    .severity-critical .severity-badge { color: #dc2626; }
    .severity-critical mat-icon { color: #dc2626; }
    .severity-high { border-left: 4px solid #ea580c; }
    .severity-high .severity-badge { color: #ea580c; }
    .severity-high mat-icon { color: #ea580c; }
    .severity-medium { border-left: 4px solid #ca8a04; }
    .severity-medium .severity-badge { color: #ca8a04; }
    .severity-medium mat-icon { color: #ca8a04; }
    .severity-low, .severity-info { border-left: 4px solid #16a34a; }
    .severity-low .severity-badge, .severity-info .severity-badge { color: #16a34a; }
    .severity-low mat-icon, .severity-info mat-icon { color: #16a34a; }

    @media (max-width: 900px) { .ai-grid { grid-template-columns: 1fr; } }
  `],
})
export class AiPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigService);

  status = signal<AiStatus | null>(null);
  chatHistory = signal<{ role: string; text: string }[]>([]);
  chatMessage = '';
  chatLoading = signal(false);
  auditLoading = signal(false);
  recsLoading = signal(false);
  insightsLoading = signal(false);
  analysisResult = signal<AiResponse | null>(null);
  insights = signal<Insight[]>([]);
  resultTitle = signal('');
  resultIcon = signal('analytics');

  private get baseUrl(): string {
    return this.config.get('coreApiBaseUrl') || '/api/core';
  }

  ngOnInit(): void {
    this.http.get<AiStatus>(`${this.baseUrl}/v1/ai/status`).subscribe({
      next: s => this.status.set(s),
      error: () => this.status.set({ engine: 'rule-engine', provider: 'built-in', model: 'rule-based-v1', capabilities: [] }),
    });
  }

  async sendChat(): Promise<void> {
    if (!this.chatMessage.trim() || this.chatLoading()) return;
    const msg = this.chatMessage.trim();
    this.chatMessage = '';
    this.chatHistory.update(h => [...h, { role: 'user', text: msg }]);
    this.chatLoading.set(true);

    this.http.post<AiResponse>(`${this.baseUrl}/v1/ai/chat`, { message: msg }).subscribe({
      next: resp => {
        this.chatHistory.update(h => [...h, { role: 'ai', text: resp.content }]);
        this.chatLoading.set(false);
      },
      error: () => {
        this.chatHistory.update(h => [...h, { role: 'ai', text: 'Erro ao consultar a IA. Verifique se o backend está rodando.' }]);
        this.chatLoading.set(false);
      },
    });
  }

  analyzeAudit(): void {
    this.auditLoading.set(true);
    this.http.post<AiResponse>(`${this.baseUrl}/v1/ai/analyze-audit?hoursBack=24`, {}).subscribe({
      next: resp => {
        this.analysisResult.set(resp);
        this.resultTitle.set('Análise de Auditoria');
        this.resultIcon.set('security');
        this.auditLoading.set(false);
      },
      error: () => this.auditLoading.set(false),
    });
  }

  getRecommendations(): void {
    this.recsLoading.set(true);
    this.http.post<AiResponse>(`${this.baseUrl}/v1/ai/recommendations`, {}).subscribe({
      next: resp => {
        this.analysisResult.set(resp);
        this.resultTitle.set('Recomendações de Governança');
        this.resultIcon.set('lightbulb');
        this.recsLoading.set(false);
      },
      error: () => this.recsLoading.set(false),
    });
  }

  getInsights(): void {
    this.insightsLoading.set(true);
    this.http.get<AiResponse>(`${this.baseUrl}/v1/ai/insights`).subscribe({
      next: resp => {
        const data = resp.context?.['insights'] as Insight[] ?? [];
        this.insights.set(data);
        this.insightsLoading.set(false);
      },
      error: () => this.insightsLoading.set(false),
    });
  }

  severityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'check_circle';
    }
  }
}
