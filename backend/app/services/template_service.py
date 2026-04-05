from __future__ import annotations


class AgentTemplateService:
    def list_templates(self) -> list[dict]:
        return [
            self._tpl("programmer", "程序员助手", "资深工程师，擅长重构与调试", "你是资深软件工程师。优先给出可执行方案。", "openai/gpt-4.1"),
            self._tpl("researcher", "研究员", "擅长深度调研和引用整理", "你是严谨研究员。请给出结论和依据。", "anthropic/claude-3-7-sonnet"),
            self._tpl("writer", "作家", "风格化写作与叙事创作", "你是专业作家，注重文风和结构。", "google/gemini-2.5-pro"),
            self._tpl("analyst", "分析师", "商业与数据分析", "你是数据分析师，用结构化方式回答。", "deepseek/deepseek-chat"),
            self._tpl("translator", "翻译官", "多语种高质量翻译", "你是专业翻译，保留语气和术语准确性。", "tongyi/qwen-max"),
            self._tpl("pm", "产品经理", "需求拆解和方案评估", "你是产品经理，注重目标和可落地性。", "openai/gpt-4.1-mini"),
            self._tpl("teacher", "教学导师", "分层讲解与练习生成", "你是教学导师，循序渐进地解释。", "wenxin/ernie-4.0"),
            self._tpl("qa", "测试工程师", "测试设计和缺陷分析", "你是测试工程师，关注边界和回归风险。", "doubao/seed-1.6"),
            self._tpl("ops", "运维专家", "部署、监控与稳定性优化", "你是运维专家，优先稳定性和可观测性。", "anthropic/claude-3-5-sonnet"),
            self._tpl("legal", "法务助理", "合同审阅和合规提示", "你是法务助理，提示风险并给出保守建议。", "google/gemini-2.0-flash"),
            self._tpl("sales", "销售顾问", "销售话术与客户沟通", "你是销售顾问，注重价值表达和行动引导。", "deepseek/deepseek-chat"),
        ]

    @staticmethod
    def _tpl(template_id: str, name: str, description: str, prompt: str, model: str) -> dict:
        return {
            "id": template_id,
            "name": name,
            "description": description,
            "agent": {
                "name": name,
                "description": description,
                "avatar": "🤖",
                "system_prompt": prompt,
                "model_config": {"model": model, "temperature": 0.7, "max_tokens": 2048},
                "tools": [
                    {"name": "web-search", "enabled": True, "config": {}},
                    {"name": "code-exec", "enabled": False, "config": {}},
                ],
                "memory": {"short_term_turns": 20, "long_term_enabled": False, "long_term_namespace": "default"},
                "tags": [template_id],
            },
        }
