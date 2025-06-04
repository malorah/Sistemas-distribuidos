#!/usr/bin/env python3
import os
import argparse

def dump_project_contents(root_dir: str, output_file: str):
    """
    Recorre recursivamente 'root_dir', omite carpetas node_modules y package-lock.json,
    y escribe en 'output_file' la ruta relativa y el contenido de cada archivo de texto.
    """
    with open(output_file, 'w', encoding='utf-8') as out_f:
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # Evitar entrar en carpetas node_modules
            if "node_modules" in dirnames:
                dirnames.remove("node_modules")
                
            if "mongo-data" in dirnames:
                dirnames.remove("mongo-data")
                
            if "venv" in dirnames:
                dirnames.remove("venv")

            dirnames.sort()
            filenames.sort()

            for fname in filenames:
                # Omitir package-lock.json
                if fname == "package-lock.json":
                    continue

                file_path = os.path.join(dirpath, fname)
                rel_path = os.path.relpath(file_path, root_dir)

                try:
                    with open(file_path, 'r', encoding='utf-8') as in_f:
                        content = in_f.read()
                except (UnicodeDecodeError, PermissionError):
                    # Si no es texto UTF-8 o no se puede leer, lo omitimos
                    continue

                out_f.write(f"{rel_path}:\n\n")
                out_f.write('"""' + "\n")
                out_f.write(content.rstrip("\n") + "\n")
                out_f.write('"""\n\n')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Genera un TXT con rutas y contenido de archivos, ignorando node_modules y package-lock.json."
    )
    parser.add_argument(
        "proyecto_dir",
        nargs="?",
        default=".",
        help="Carpeta raíz del proyecto a escanear (por defecto: carpeta actual)."
    )
    parser.add_argument(
        "-o", "--output",
        default="output.txt",
        help="Nombre (o ruta) del archivo de salida. Por defecto: output.txt"
    )
    args = parser.parse_args()

    proyecto_dir = os.path.abspath(args.proyecto_dir)
    output_txt = args.output

    if not os.path.isdir(proyecto_dir):
        print(f"Error: '{proyecto_dir}' no es un directorio válido.")
        exit(1)

    dump_project_contents(proyecto_dir, output_txt)
    print(f"Se ha generado '{output_txt}' con el contenido de '{proyecto_dir}', ignorando node_modules y package-lock.json.")
