# Contributing to VecTrade MCP

Thank you for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/VecTrade-io/vectrade-mcp.git
cd vectrade-mcp
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install pytest pytest-cov ruff
```

## Running Tests

```bash
pytest --cov=vectrade_mcp --cov-report=term-missing
```

Coverage must stay at or above **90 %**. CI enforces this on every PR.

## Code Style

This project uses [Ruff](https://docs.astral.sh/ruff/) for linting and formatting:

```bash
ruff check .
ruff format .
```

## Pull Request Process

1. Fork the repository and create a feature branch.
2. Add tests for any new functionality.
3. Ensure `pytest` and `ruff check` pass locally.
4. Open a PR against `main` with a clear description.

## Reporting Issues

Open an issue at <https://github.com/VecTrade-io/vectrade-mcp/issues>.

## License

By contributing you agree that your contributions will be licensed under the MIT License.
