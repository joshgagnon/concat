from __future__ import print_function
import errno
import logging
from flask import Flask, request, send_file, jsonify
import os
import os.path
from io import BytesIO
import tempfile
from subprocess import Popen, STDOUT
import uuid
try:
    from subprocess import DEVNULL  # py3k
except ImportError:
    import os
    DEVNULL = open(os.devnull, 'wb')

logging.basicConfig()

PORT = 5669


app = Flask(__name__, static_url_path='', static_folder='public')

concat_cmds = ['gs', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dCompatibilityLevel=1.4', '-q', '-sDEVICE=pdfwrite',
    '-sColorConversionStrategy=/LeaveColorUnchanged'
    '-dAutoFilterColorImages=true',
    '-dAutoFilterGrayImages=true',
    '-dDownsampleMonoImages=true',
    '-dDownsampleGrayImages=true',
    #'-dDownsampleColorImages=true',
    '-dColorImageResolution=144'
     #'-dPDFSETTINGS=/ebook'
]

thumb_cmds = ['convert', '-thumbnail', '150x', '-background', 'white', '-alpha', 'remove']



TMP_DIR = '/tmp/.concat/'


def concat_file_ids(file_ids, options):
    try:
        print(file_ids)
        output = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        args = concat_cmds[:] + ['-sOutputFile=%s' % output.name]

        if options.get('deskew') == 'true':
            args += ['-deskew', '40']


        for f in file_ids:
            args.append(os.path.join(TMP_DIR, f)+'.pdf')

        Popen(args,
              stdout=DEVNULL,
              stderr=STDOUT).wait()
        return output.read()
    except Exception as e:
        raise e
    finally:
        output.close()


def thumb(file_id):
    try:
        output = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        args = thumb_cmds[:] + [os.path.join(TMP_DIR, file_id + '.pdf[0]'), output.name]
        Popen(args,
              stdout=DEVNULL,
              stderr=STDOUT).wait()
        return output.read()
    except Exception, e:
        raise e
    finally:
        output.close()



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


def upload(files):
    results = {}
    for f in files:
        file_id = str(uuid.uuid4())
        results[f.filename] = file_id
        f.save(os.path.join(TMP_DIR, file_id + '.pdf'))
    return results

def remove(file_ids):
    for file_id in file_ids:
        try:
            os.remove(os.path.join(TMP_DIR, file_id + '.pdf'))
        except: pass


@app.route('/upload', methods=['POST'])
def upload_files():
    try:
        return jsonify(upload(request.files.getlist("file[]")))
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)


@app.route('/thumb/<uuid>', methods=['GET'])
def thumbview(uuid):
    try:
        result = thumb(uuid)
        return send_file(BytesIO(result),
                         mimetype='image/png')
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)


@app.route('/concat', methods=['GET'])
def concat():
    try:
        result = concat_file_ids(request.args.getlist("file_ids[]"), options=request.args)
        return send_file(BytesIO(result),
                         attachment_filename=request.args.get('filename', 'concat-merge.pdf'),
                         as_attachment=True,
                         mimetype='application/pdf')
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)


@app.route('/upload_concat', methods=['POST'])
def upload_concat():
    try:

        uploads = upload(request.files.getlist("file[]"))
        file_ids = map(lambda x: uploads[x.filename], request.files.getlist("file[]"))
        result = concat_file_ids(file_ids, options=request.args)
        remove(file_ids)
        return send_file(BytesIO(result),
                         attachment_filename=request.args.get('filename', 'concat-merge.pdf'),
                         as_attachment=True,
                         mimetype='application/pdf')
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)

@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('index.html')

@app.route('/status', methods=['GET'])
def status():
    return app.send_static_file('status.html')

@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


try:
    os.makedirs(TMP_DIR)
except OSError as exception:
    if exception.errno != errno.EEXIST:
        raise
if __name__ == '__main__':
    print('Running on %d' % PORT)
    app.run(port=PORT, debug=True, host='0.0.0.0')
