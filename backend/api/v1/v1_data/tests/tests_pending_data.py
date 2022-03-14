from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_data.constants import DataApprovalStatus
from api.v1.v1_data.models import PendingFormData, PendingDataApproval, \
    PendingDataBatch
from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_users.models import SystemUser


@override_settings(USE_TZ=False)
class PendingDataTestCase(TestCase):
    def tests_pending_data(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        call_command("fake_user_seeder", "-r", 100)
        call_command('form_approval_seeder')
        call_command('form_approval_assignment_seeder')
        call_command('fake_pending_data_seeder', '-r', 1, '-t', True, '-b', 1)

        admin_user = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.admin).first()
        if admin_user:
            t = RefreshToken.for_user(admin_user)
            header = {'HTTP_AUTHORIZATION': f'Bearer {t.access_token}'}
            response = self.client.get(
                '/api/v1/form-pending-batch?page=1',
                content_type='application/json',
                **header)
            self.assertEqual(200, response.status_code)

            self.assertEqual(['current', 'total', 'total_page', 'batch'],
                             list(response.json()))

            if response.json().get('total') > 0:
                data = response.json().get('batch')
                self.assertEqual([
                    'id', 'name', 'form', 'administration', 'created_by',
                    'created', 'approver', 'approved'], list(data[0]))
                response = self.client.get('/api/v1/pending-data/{0}'.format(
                    data[0].get('id')),
                    content_type='application/json',
                    **header)
                self.assertEqual(200, response.status_code)
                self.assertEqual(['history', 'question', 'value'],
                                 list(response.json()[0]))
                response = self.client.get(
                    '/api/v1/form-pending-data-batch/{}'.format(data[0]['id']),
                    content_type='application/json',
                    **header)
                self.assertEqual(200, response.status_code)
                self.assertEqual(
                    ['id', 'name', 'form', 'administration', 'geo',
                     'created_by', 'created'], list(response.json()[0]))

        values = list(PendingFormData.objects.all().values_list('id',
                                                                flat=True))
        payload = {"name": "Test Batch", "data": values}
        response = self.client.post('/api/v1/batch',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get('message'),
                         'Data updated successfully')
        payload = {"name": "Test Batch", "data": values}
        response = self.client.post('/api/v1/batch',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(response.status_code, 400)

        response = self.client.get('/api/v1/batch',
                                   content_type='application/json',
                                   **header)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.json()[0]), [
            'name', 'form', 'administration', 'file', 'total_data', 'created',
            'updated'
        ])

    def test_pending_batch_list(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        call_command("fake_user_seeder", "-r", 100)
        call_command('form_approval_seeder')
        call_command('form_approval_assignment_seeder')
        call_command('fake_pending_data_seeder', '-r', 5, '-t', True, '-b', 5)

        # get the lowest level approver
        approval: PendingDataApproval = PendingDataApproval.objects.filter(
            level__level=3).first()
        if approval:
            t_child = RefreshToken.for_user(approval.user)
            header = {'HTTP_AUTHORIZATION': f'Bearer {t_child.access_token}'}
            # subordinate = false, approved = false
            response = self.client.get(
                '/api/v1/form-pending-batch?page=1',
                content_type='application/json',
                **header)
            self.assertEqual(200, response.status_code)
            self.assertEqual(
                response.json().get('batch')[0]['approver']['status'],
                DataApprovalStatus.pending)
            self.assertEqual(
                response.json().get('batch')[0]['approver']['allow_approve'],
                True)
            # subordinate = true
            response = self.client.get(
                '/api/v1/form-pending-batch?page=1&subordinate=true',
                content_type='application/json',
                **header)
            self.assertEqual(200, response.status_code)
            self.assertEqual(0, len(response.json().get('batch')))

            # get parent level user
            p_approval = PendingDataApproval.objects.filter(
                batch_id=approval.batch_id,
                level__level__lt=approval.level.level
            ).order_by('-level__level').first()
            t_parent = RefreshToken.for_user(p_approval.user)
            header = {'HTTP_AUTHORIZATION': f'Bearer {t_parent.access_token}'}
            # subordinate = false, approved = false
            response = self.client.get(
                '/api/v1/form-pending-batch?page=1',
                content_type='application/json',
                **header)
            self.assertEqual(200, response.status_code)
            self.assertEqual(0, len(response.json().get('batch')))
            # subordinate = true
            response = self.client.get(
                '/api/v1/form-pending-batch?page=1&subordinate=true',
                content_type='application/json',
                **header)
            self.assertEqual(200, response.status_code)
            self.assertGreaterEqual(len(response.json().get('batch')), 1)

            # approve data with child
            payload = {
                'batch': [approval.batch_id],
                'status': DataApprovalStatus.approved
            }
            header = {'HTTP_AUTHORIZATION': f'Bearer {t_child.access_token}'}
            response = self.client.post(
                '/api/v1/pending-data/approve',
                payload,
                content_type='application/json',
                **header)
            self.assertEqual(200, response.status_code)
            # approved = true
            response = self.client.get(
                '/api/v1/form-pending-batch?page=1&approved=true',
                content_type='application/json',
                **header)
            self.assertEqual(200, response.status_code)
            self.assertGreaterEqual(len(response.json().get('batch')), 1)

            # subordinate = false, approved = false
            header = {'HTTP_AUTHORIZATION': f'Bearer {t_parent.access_token}'}
            response = self.client.get(
                '/api/v1/form-pending-batch?page=1',
                content_type='application/json',
                **header)
            self.assertEqual(200, response.status_code)
            self.assertGreaterEqual(len(response.json().get('batch')), 1)

    def test_batch_summary(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        call_command("form_seeder", "--test")
        call_command("fake_user_seeder", "-r", 100)
        call_command('form_approval_seeder')
        call_command('form_approval_assignment_seeder')
        call_command('fake_pending_data_seeder', '-r', 5, '-t', True, '-b', 5)
        token = user_response.json().get('token')
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        response = self.client.get('/api/v1/batch/summary/{0}'.format(
            PendingDataBatch.objects.first().id), follow=True, **header)
        self.assertEqual(200, response.status_code)
        for summary in response.json():
            if summary.get('type') in \
                    [QuestionTypes.FieldStr.get(QuestionTypes.option),
                     QuestionTypes.FieldStr.get(
                         QuestionTypes.multiple_option)]:
                self.assertEqual(['type', 'total'],
                                 list(summary.get('value')[0]))
            else:
                self.assertEqual(int,
                                 type(summary.get('value')))
