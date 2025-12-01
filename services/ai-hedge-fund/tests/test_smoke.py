"""
AI Hedge Fund - Smoke Tests

Quick tests to verify core functionality:
- Config loading
- Agent base classes
- API endpoints
- Signal processing
"""

import pytest
from pydantic import ValidationError


# ============================================================================
# CONFIG TESTS
# ============================================================================

class TestConfigSmoke:
    """Smoke tests for configuration"""

    def test_settings_loads_with_defaults(self):
        """Settings should load with sensible defaults"""
        from src.config import Settings

        settings = Settings()

        assert settings.llm_provider in ["anthropic", "openai"]
        assert settings.trading_mode in ["paper", "micro", "live"]
        assert settings.max_position_size_usd > 0
        assert settings.daily_loss_limit_usd > 0

    def test_settings_default_is_paper_mode(self):
        """Default mode should be paper for safety"""
        from src.config import Settings

        settings = Settings()

        assert settings.trading_mode == "paper"
        assert settings.require_approval is True

    def test_get_settings_returns_settings(self):
        """get_settings() should return a Settings instance"""
        from src.config import get_settings

        settings = get_settings()

        assert settings is not None
        assert hasattr(settings, "trading_mode")
        assert hasattr(settings, "max_position_size_usd")


# ============================================================================
# BASE AGENT TESTS
# ============================================================================

class TestAgentSignalSmoke:
    """Smoke tests for AgentSignal model"""

    def test_agent_signal_valid_bullish(self):
        """Should create valid bullish signal"""
        from src.agents.base_agent import AgentSignal

        signal = AgentSignal(
            action="bullish",
            confidence=75.0,
            reasoning="Test reasoning",
            token="SOL",
            agent_name="TestAgent",
        )

        assert signal.action == "bullish"
        assert signal.confidence == 75.0
        assert signal.token == "SOL"

    def test_agent_signal_valid_bearish(self):
        """Should create valid bearish signal"""
        from src.agents.base_agent import AgentSignal

        signal = AgentSignal(
            action="bearish",
            confidence=60.0,
            reasoning="Market weakness",
            token="BTC",
            agent_name="TestAgent",
        )

        assert signal.action == "bearish"
        assert signal.confidence == 60.0

    def test_agent_signal_valid_neutral(self):
        """Should create valid neutral signal"""
        from src.agents.base_agent import AgentSignal

        signal = AgentSignal(
            action="neutral",
            confidence=50.0,
            reasoning="Mixed signals",
            token="ETH",
            agent_name="TestAgent",
        )

        assert signal.action == "neutral"

    def test_agent_signal_confidence_bounds(self):
        """Confidence should be bounded 0-100"""
        from src.agents.base_agent import AgentSignal

        # Valid at boundaries
        signal_low = AgentSignal(
            action="neutral",
            confidence=0,
            reasoning="Test",
            token="SOL",
            agent_name="Test",
        )
        assert signal_low.confidence == 0

        signal_high = AgentSignal(
            action="neutral",
            confidence=100,
            reasoning="Test",
            token="SOL",
            agent_name="Test",
        )
        assert signal_high.confidence == 100

    def test_agent_signal_rejects_invalid_confidence(self):
        """Should reject confidence outside 0-100"""
        from src.agents.base_agent import AgentSignal

        with pytest.raises(ValidationError):
            AgentSignal(
                action="bullish",
                confidence=150,  # Invalid
                reasoning="Test",
                token="SOL",
                agent_name="Test",
            )

    def test_agent_signal_rejects_invalid_action(self):
        """Should reject invalid action values"""
        from src.agents.base_agent import AgentSignal

        with pytest.raises(ValidationError):
            AgentSignal(
                action="invalid",  # Invalid
                confidence=50,
                reasoning="Test",
                token="SOL",
                agent_name="Test",
            )


class TestAgentConfigSmoke:
    """Smoke tests for AgentConfig model"""

    def test_agent_config_valid(self):
        """Should create valid agent config"""
        from src.agents.base_agent import AgentConfig

        config = AgentConfig(
            name="Test Agent",
            description="Test description",
            philosophy="Test philosophy",
            risk_tolerance="medium",
            time_horizon="medium",
            focus_areas=["area1", "area2"],
        )

        assert config.name == "Test Agent"
        assert config.risk_tolerance == "medium"
        assert len(config.focus_areas) == 2

    def test_agent_config_risk_levels(self):
        """Should accept all valid risk levels"""
        from src.agents.base_agent import AgentConfig

        for risk in ["low", "medium", "high", "degen"]:
            config = AgentConfig(
                name="Test",
                description="Test",
                philosophy="Test",
                risk_tolerance=risk,
                time_horizon="medium",
                focus_areas=[],
            )
            assert config.risk_tolerance == risk

    def test_agent_config_time_horizons(self):
        """Should accept all valid time horizons"""
        from src.agents.base_agent import AgentConfig

        for horizon in ["short", "medium", "long"]:
            config = AgentConfig(
                name="Test",
                description="Test",
                philosophy="Test",
                risk_tolerance="medium",
                time_horizon=horizon,
                focus_areas=[],
            )
            assert config.time_horizon == horizon


# ============================================================================
# AGENT CONFIGS SMOKE TESTS
# ============================================================================

class TestAgentConfigsSmoke:
    """Smoke tests for predefined agent configurations"""

    def test_persona_agents_exist(self):
        """All persona agent configs should be importable"""
        from src.agents.personas import (
            BUFFETT_CONFIG,
            BURRY_CONFIG,
            MUNGER_CONFIG,
            WOOD_CONFIG,
            ACKMAN_CONFIG,
        )

        configs = [BUFFETT_CONFIG, BURRY_CONFIG, MUNGER_CONFIG, WOOD_CONFIG, ACKMAN_CONFIG]

        for config in configs:
            assert config.name
            assert config.description
            assert config.philosophy
            assert config.risk_tolerance in ["low", "medium", "high", "degen"]

    def test_crypto_agents_exist(self):
        """All crypto agent configs should be importable"""
        from src.agents.crypto import (
            DEGEN_CONFIG,
            SOLANA_CONFIG,
            WHALE_CONFIG,
            ONCHAIN_CONFIG,
        )

        configs = [DEGEN_CONFIG, SOLANA_CONFIG, WHALE_CONFIG, ONCHAIN_CONFIG]

        for config in configs:
            assert config.name
            assert config.risk_tolerance in ["low", "medium", "high", "degen"]

    def test_management_agents_exist(self):
        """Management agent configs should be importable"""
        from src.agents.management import (
            RISK_MANAGER_CONFIG,
            PORTFOLIO_MANAGER_CONFIG,
        )

        assert RISK_MANAGER_CONFIG.name == "Risk Manager"
        assert RISK_MANAGER_CONFIG.risk_tolerance == "low"

        assert PORTFOLIO_MANAGER_CONFIG.name
        assert PORTFOLIO_MANAGER_CONFIG.focus_areas


# ============================================================================
# API ROUTES SMOKE TESTS
# ============================================================================

class TestAPIRoutesSmoke:
    """Smoke tests for API route models"""

    def test_analyze_request_model(self):
        """AnalyzeRequest should validate correctly"""
        from src.api.routes import AnalyzeRequest

        request = AnalyzeRequest(token="SOL")

        assert request.token == "SOL"
        assert request.chain == "solana"
        assert request.mode == "full"
        assert request.provider == "anthropic"

    def test_analyze_request_modes(self):
        """Should accept all valid analysis modes"""
        from src.api.routes import AnalyzeRequest

        for mode in ["full", "fast", "degen"]:
            request = AnalyzeRequest(token="SOL", mode=mode)
            assert request.mode == mode

    def test_quick_signal_request_model(self):
        """QuickSignalRequest should validate correctly"""
        from src.api.routes import QuickSignalRequest

        request = QuickSignalRequest(token="BTC")

        assert request.token == "BTC"
        assert request.chain == "solana"

    def test_agent_signal_response_model(self):
        """AgentSignalResponse should validate correctly"""
        from src.api.routes import AgentSignalResponse

        response = AgentSignalResponse(
            agent="TestAgent",
            action="bullish",
            confidence=75.0,
            reasoning="Test reasoning",
        )

        assert response.agent == "TestAgent"
        assert response.action == "bullish"
        assert response.key_metrics == []
        assert response.risks == []

    def test_set_mode_request_model(self):
        """SetModeRequest should validate correctly"""
        from src.api.routes import SetModeRequest

        request = SetModeRequest(mode="paper")
        assert request.mode == "paper"
        assert request.approval_code is None

        request_with_code = SetModeRequest(mode="micro", approval_code="test123")
        assert request_with_code.approval_code == "test123"

    def test_hunter_signal_model(self):
        """HunterSignal should validate correctly"""
        from src.api.routes import HunterSignal

        signal = HunterSignal(
            id="test-1",
            type="price_move",
            source="binance",
            token="SOL",
            chain="solana",
            action="buy",
            confidence=75.0,
            urgency="today",
            title="SOL Breakout",
            description="Strong price movement",
            reasoning="Technical breakout",
            risk="medium",
        )

        assert signal.id == "test-1"
        assert signal.action == "buy"
        assert signal.confidence == 75.0
        assert signal.riskFactors == []


# ============================================================================
# API CLIENT TESTS (using TestClient)
# ============================================================================

class TestAPIEndpointsSmoke:
    """Smoke tests for actual API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        from fastapi.testclient import TestClient
        from src.api.app import app

        return TestClient(app)

    def test_health_endpoint(self, client):
        """Health endpoint should return healthy status"""
        response = client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert data["agents_available"] == 12

    def test_agents_endpoint(self, client):
        """Agents endpoint should list all agents"""
        response = client.get("/api/v1/agents")

        assert response.status_code == 200
        data = response.json()
        assert "agents" in data
        assert len(data["agents"]) >= 10

        # Check agent structure
        agent = data["agents"][0]
        assert "name" in agent
        assert "description" in agent
        assert "risk_tolerance" in agent
        assert "focus_areas" in agent

    def test_status_endpoint(self, client):
        """Status endpoint should return trading status"""
        response = client.get("/api/v1/status")

        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "paper"
        assert "positions" in data
        assert "pnlToday" in data
        assert "limits" in data

    def test_mode_endpoint(self, client):
        """Mode endpoint should return current mode"""
        response = client.get("/api/v1/mode")

        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "paper"
        assert "requireApproval" in data

    def test_positions_endpoint(self, client):
        """Positions endpoint should return positions list"""
        response = client.get("/api/v1/positions")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_treasury_endpoint(self, client):
        """Treasury endpoint should return treasury data"""
        response = client.get("/api/v1/treasury")

        assert response.status_code == 200
        data = response.json()
        assert "totalUsd" in data
        assert "allocations" in data
        assert "expenses" in data

    def test_signal_queue_endpoint(self, client):
        """Signal queue endpoint should return queue"""
        response = client.get("/api/v1/signals/queue")

        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert "signals" in data

    def test_trades_today_endpoint(self, client):
        """Trades today endpoint should return trades"""
        response = client.get("/api/v1/trades/today")

        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert "trades" in data
        assert "pnl" in data


# ============================================================================
# SIGNAL PROCESSING SMOKE TESTS
# ============================================================================

class TestSignalProcessingSmoke:
    """Smoke tests for signal processing"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        from fastapi.testclient import TestClient
        from src.api.app import app

        return TestClient(app)

    def test_receive_signal_filters_low_confidence(self, client):
        """Low confidence signals should be rejected"""
        response = client.post("/api/v1/signals", json={
            "signals": [{
                "id": "test-low",
                "type": "price_move",
                "source": "test",
                "action": "buy",
                "confidence": 30,  # Below 50 threshold
                "urgency": "today",
                "title": "Test",
                "description": "Test",
                "reasoning": "Test",
                "risk": "low",
            }]
        })

        assert response.status_code == 200
        data = response.json()
        assert data["rejected"] == 1
        assert data["results"][0]["status"] == "rejected"
        assert "Confidence too low" in data["results"][0]["reason"]

    def test_receive_signal_filters_extreme_risk(self, client):
        """Extreme risk signals should be rejected"""
        response = client.post("/api/v1/signals", json={
            "signals": [{
                "id": "test-extreme",
                "type": "price_move",
                "source": "test",
                "action": "buy",
                "confidence": 80,
                "urgency": "today",
                "title": "Test",
                "description": "Test",
                "reasoning": "Test",
                "risk": "extreme",  # Should be rejected
            }]
        })

        assert response.status_code == 200
        data = response.json()
        assert data["rejected"] == 1
        assert "Risk too high" in data["results"][0]["reason"]

    def test_receive_signal_queues_valid(self, client):
        """Valid signals should be queued"""
        # Clear queue first
        client.delete("/api/v1/signals/queue")

        response = client.post("/api/v1/signals", json={
            "signals": [{
                "id": "test-valid",
                "type": "price_move",
                "source": "test",
                "action": "buy",
                "confidence": 65,
                "urgency": "today",
                "title": "Valid Signal",
                "description": "Test",
                "reasoning": "Test",
                "risk": "medium",
            }]
        })

        assert response.status_code == 200
        data = response.json()
        assert data["queued"] >= 1
        assert data["results"][0]["status"] in ["queued", "analyzing"]


# ============================================================================
# POSITION MANAGEMENT SMOKE TESTS
# ============================================================================

class TestPositionManagementSmoke:
    """Smoke tests for position management"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        from fastapi.testclient import TestClient
        from src.api.app import app

        return TestClient(app)

    def test_add_position_respects_size_limit(self, client):
        """Should reject positions exceeding limit"""
        response = client.post("/api/v1/positions", params={
            "token": "TEST",
            "size": 999999,  # Way over limit
        })

        assert response.status_code == 400
        assert "exceeds limit" in response.json()["detail"]

    def test_add_valid_position(self, client):
        """Should add valid position"""
        response = client.post("/api/v1/positions", params={
            "token": "SMOKE_TEST",
            "size": 50,
            "entry_price": 100.0,
        })

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["position"]["token"] == "SMOKE_TEST"

        # Clean up - close the position
        client.delete("/api/v1/positions/SMOKE_TEST")

    def test_close_nonexistent_position(self, client):
        """Should return 404 for nonexistent position"""
        response = client.delete("/api/v1/positions/NONEXISTENT_TOKEN_XYZ")

        assert response.status_code == 404
