from __future__ import print_function
import logging
from flask import Flask, request, send_file
from flask import jsonify
import os
import os.path
from io import BytesIO
import tempfile
from subprocess import Popen, STDOUT
import shutil
import errno
try:
    from subprocess import DEVNULL  # py3k
except ImportError:
    import os
    DEVNULL = open(os.devnull, 'wb')

logging.basicConfig()

PORT = 5669


app = Flask(__name__, static_url_path='', static_folder='public')

cmds = ['gs', '-dBATCH', '-dNOPAUSE', '-q', '-sDEVICE=pdfwrite' ]#, '-dPDFSETTINGS=/prepress']


def concat(files):
    try:
        output = tempfile.NamedTemporaryFile(suffix='.pdf', delete = False)
        args = cmds[:] + ['-sOutputFile=%s' % output.name]
        uploads = []

        for (k, f) in files.items():
            t = tempfile.NamedTemporaryFile(suffix='.pdf', delete = False)
            t.write(f.read())
            t.flush()
            uploads.append(f)
            args.append(t.name)

        Popen(args,
             stdout=DEVNULL,
             stderr=STDOUT).wait()
        return output.read()
    except Exception as e:
        raise e
    finally:
        output.close()
        [u.close() for u in uploads]


class InvalidUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


@app.route('/concat', methods=['POST'])
def render():
    try:
        result = concat(request.files)
        return send_file(BytesIO(result),
                         attachment_filename=request.files.keys()[0],
                         as_attachment=True,
                         mimetype='application/pdf')
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)


@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('index.html')


@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


if __name__ == '__main__':
    print('Running on %d' % PORT)
    app.run(port=PORT, debug=True)
