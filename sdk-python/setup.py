from setuptools import setup, find_packages

setup(
    name="acrossed",
    version="1.0.0",
    description="Sub-millisecond rule enforcement engine — Python SDK for Acrossed.",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    author="Acrossed",
    url="https://acrossed.com",
    license="MIT",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[],
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Security",
    ],
)
