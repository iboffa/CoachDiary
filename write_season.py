import pathlib
pathlib.Path("src/app/features/season/season.component.html").write_text("<test/>", encoding="utf-8")
print("ok")