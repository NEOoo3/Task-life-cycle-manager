import flask
import flask_cors

import database
import routes


def create_app(database_url: str = "sqlite:///./tasks.db") -> flask.Flask:
    app = flask.Flask(__name__)
    flask_cors.CORS(app, resources={r"/api/*": {"origins": "*"}})

    database.init_db(database_url)
    app.register_blueprint(routes.tasks_bp)

    @app.errorhandler(404)
    def not_found(_e):
        return flask.jsonify({"error": "Not Found", "detail": "This route does not exist."}), 404

    @app.errorhandler(405)
    def method_not_allowed(_e):
        return flask.jsonify({"error": "Method Not Allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return flask.jsonify({"error": "Internal Server Error", "detail": str(e)}), 500

    return app


if __name__ == "__main__":
    create_app().run(debug=True, port=5000)
