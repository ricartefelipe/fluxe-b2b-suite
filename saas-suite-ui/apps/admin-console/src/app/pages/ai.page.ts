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
import { I18nService } from '@saas-suite/shared/i18n';

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
            {{ i18n.messages().admin.aiTitle }}
          </h1>
          <p class="subtitle">{{ i18n.messages().admin.aiSubtitle }}</p>
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
          <mat-card-title>{{ i18n.messages().admin.chatWithAi }}</mat-card-title>
          <mat-card-subtitle>{{ i18n.messages().admin.chatSubtitle }}</mat-card-subtitle>
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
                [placeholder]="i18n.messages().admin.chatPlaceholder"
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
          <h3>{{ i18n.messages().admin.analyzeAudit }}</h3>
          <p>{{ i18n.messages().admin.analyzeAuditDesc }}</p>
          @if (auditLoading()) { <mat-spinner diameter="24" /> }
        </mat-card>

        <mat-card class="action-card" (click)="getRecommendations()">
          <mat-icon class="action-icon" style="color: #1565c0">lightbulb</mat-icon>
          <h3>{{ i18n.messages().admin.recommendations }}</h3>
          <p>{{ i18n.messages().admin.recommendationsDesc }}</p>
          @if (recsLoading()) { <mat-spinner diameter="24" /> }
        </mat-card>

        <mat-card class="action-card" (click)="getInsights()">
          <mat-icon class="action-icon" style="color: #2e7d32">insights</mat-icon>
          <h3>{{ i18n.messages().admin.insights }}</h3>
          <p>{{ i18n.messages().admin.insightsDesc }}</p>
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
    :host { display: block; padding: 24px; color: #e2e8f0; }

    .page-header { margin-bottom: 24px; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; }
    h1 { font-size: 28px; font-weight: 700; color: #e2e8f0; margin: 0 0 4px; display: flex; align-items: center; gap: 10px; }
    .title-icon { font-size: 32px; width: 32px; height: 32px; color: #42a5f5; }
    .subtitle { color: #94a3b8; margin: 0; font-size: 14px; }

    .engine-badge {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; border-radius: 20px;
      background: rgba(255,255,255,0.08); color: #cbd5e1;
      font-size: 13px; font-weight: 600;
    }
    .engine-badge.llm { background: rgba(66,165,245,0.15); color: #42a5f5; }
    .engine-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .ai-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; margin-bottom: 24px; }

    .chat-card { height: 480px; display: flex; flex-direction: column; }
    .chat-card mat-card-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column; gap: 12px; }
    .chat-msg { display: flex; gap: 10px; align-items: flex-start; }
    .chat-msg.user { flex-direction: row-reverse; }
    .chat-msg.user .msg-content { background: #1565c0; color: #fff; border-radius: 16px 16px 4px 16px; }
    .chat-msg.ai .msg-content { background: rgba(255,255,255,0.07); color: #e2e8f0; border-radius: 16px 16px 16px 4px; }
    .msg-content { padding: 10px 16px; max-width: 85%; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
    .chat-msg mat-icon { flex-shrink: 0; margin-top: 4px; font-size: 20px; width: 20px; height: 20px; color: #94a3b8; }

    .chat-input { display: flex; gap: 12px; align-items: center; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); }
    .full-width { flex: 1; }

    .actions-column { display: flex; flex-direction: column; gap: 16px; }
    .action-card {
      cursor: pointer; padding: 20px; text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .action-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .action-icon { font-size: 36px; width: 36px; height: 36px; margin-bottom: 8px; }
    .action-card h3 { font-size: 15px; font-weight: 600; margin: 0 0 6px; color: #e2e8f0; }
    .action-card p { font-size: 12px; color: #94a3b8; margin: 0; }

    .result-card { margin-bottom: 24px; }
    .result-content { white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #cbd5e1; }

    .insights-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .insight-card { padding: 20px; }
    .insight-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .severity-badge { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; }
    .insight-card h3 { font-size: 15px; font-weight: 600; margin: 0 0 6px; color: #e2e8f0; }
    .insight-card p { font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5; }

    .severity-critical { border-left: 4px solid #ef5350; }
    .severity-critical .severity-badge { color: #ef5350; }
    .severity-critical mat-icon { color: #ef5350; }
    .severity-high { border-left: 4px solid #ff7043; }
    .severity-high .severity-badge { color: #ff7043; }
    .severity-high mat-icon { color: #ff7043; }
    .severity-medium { border-left: 4px solid #fdd835; }
    .severity-medium .severity-badge { color: #fdd835; }
    .severity-medium mat-icon { color: #fdd835; }
    .severity-low, .severity-info { border-left: 4px solid #66bb6a; }
    .severity-low .severity-badge, .severity-info .severity-badge { color: #66bb6a; }
    .severity-low mat-icon, .severity-info mat-icon { color: #66bb6a; }

    @media (max-width: 900px) { .ai-grid { grid-template-columns: 1fr; } }
  `],
})
export class AiPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigService);
  protected readonly i18n = inject(I18nService);

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
        this.chatHistory.update(h => [...h, { role: 'ai', text: this.i18n.messages().admin.aiError }]);
        this.chatLoading.set(false);
      },
    });
  }

  analyzeAudit(): void {
    this.auditLoading.set(true);
    this.http.post<AiResponse>(`${this.baseUrl}/v1/ai/analyze-audit?hoursBack=24`, {}).subscribe({
      next: resp => {
        this.analysisResult.set(resp);
        this.resultTitle.set(this.i18n.messages().admin.auditAnalysisTitle);
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
        this.resultTitle.set(this.i18n.messages().admin.governanceRecsTitle);
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
