from eval.test_cases import TEST_CASES


def test_has_thirty_cases():
    assert len(TEST_CASES) == 30


def test_all_ids_are_unique():
    ids = [case.id for case in TEST_CASES]
    assert len(ids) == len(set(ids))


def test_all_descriptions_are_nonempty():
    assert all(case.description.strip() for case in TEST_CASES)
